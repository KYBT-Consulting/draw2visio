#!/usr/bin/env node
/**
 * Patches draw.io Desktop's app.asar to install the fixed VSDX exporter.
 *
 * Why this is needed for draw.io v26.1+ / v32.x:
 *   draw.io Desktop removed external plugin loading (--enable-plugins) in
 *   src/main/electron.js (`isPluginsEnabled` hardcoded to `false`) and
 *   restricted ElectronApp.js to built-in scripts inside app.asar.
 *
 * What this script does:
 *   1. Backs up `<app.asar>` to `<app.asar>.bak` (if not already backed up).
 *   2. Injects `dist/visio-export-plugin.js` into:
 *      - `drawio/src/main/webapp/js/PostConfig.js` (loaded automatically at startup
 *        after `app.min.js` and `extensions.min.js`, enabling File -> Export as -> VSDX
 *        immediately with zero configuration)
 *      - `drawio/src/main/webapp/plugins/vsdx.js` (built-in plugin path)
 *   3. Updates the ASAR JSON header and SHA-256 integrity hashes.
 *
 * Usage:
 *   sudo node scripts/patch-desktop-asar.js [path/to/app.asar]
 *   sudo node scripts/patch-desktop-asar.js --restore [path/to/app.asar]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MARKER_START = '/* === DRAW2VISIO_PLUGIN_START === */';
const MARKER_END = '/* === DRAW2VISIO_PLUGIN_END === */';
const BLOCK_SIZE = 4 * 1024 * 1024; // 4 MiB ASAR integrity block size

function findDefaultAsarPath()
{
	const candidates = [
		'/opt/drawio/resources/app.asar',
		'/usr/lib/drawio/resources/app.asar',
		'/Applications/draw.io.app/Contents/Resources/app.asar',
		process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Programs', 'draw.io', 'resources', 'app.asar') : null,
		'C:\\Program Files\\draw.io\\resources\\app.asar'
	].filter(Boolean);

	for (const candidate of candidates)
	{
		if (fs.existsSync(candidate))
		{
			return candidate;
		}
	}

	return candidates[0];
}

function computeIntegrity(buf)
{
	const hash = crypto.createHash('sha256').update(buf).digest('hex');
	const blocks = [];

	if (buf.length === 0)
	{
		blocks.push(hash);
	}
	else
	{
		for (let offset = 0; offset < buf.length; offset += BLOCK_SIZE)
		{
			const slice = buf.subarray(offset, Math.min(offset + BLOCK_SIZE, buf.length));
			blocks.push(crypto.createHash('sha256').update(slice).digest('hex'));
		}
	}

	return {
		algorithm: 'SHA256',
		hash,
		blockSize: BLOCK_SIZE,
		blocks
	};
}

function getMaxPayloadOffset(node)
{
	let maxEnd = 0;
	if (node && node.files)
	{
		for (const key of Object.keys(node.files))
		{
			const childEnd = getMaxPayloadOffset(node.files[key]);
			if (childEnd > maxEnd) maxEnd = childEnd;
		}
	}
	else if (node && node.offset !== undefined && node.size !== undefined)
	{
		const end = parseInt(node.offset, 10) + node.size;
		if (end > maxEnd) maxEnd = end;
	}
	return maxEnd;
}

function getFileNode(header, relPath)
{
	const parts = relPath.split('/');
	let cur = header;
	for (const part of parts)
	{
		if (!cur || !cur.files || !cur.files[part]) return null;
		cur = cur.files[part];
	}
	return cur;
}

function setFileNode(header, relPath, entry)
{
	const parts = relPath.split('/');
	let cur = header;
	for (let i = 0; i < parts.length - 1; i++)
	{
		const part = parts[i];
		if (!cur.files[part]) cur.files[part] = { files: {} };
		cur = cur.files[part];
	}
	cur.files[parts[parts.length - 1]] = entry;
}

function patchAsar(inputPath, outputPath, pluginCode)
{
	const fd = fs.openSync(inputPath, 'r');
	try
	{
		const sizeBuf = Buffer.alloc(16);
		fs.readSync(fd, sizeBuf, 0, 16, 0);

		const picklePayloadSize = sizeBuf.readUInt32LE(4);
		const alignedHeaderSize = picklePayloadSize - 8;
		const headerStringSize = sizeBuf.readUInt32LE(12);
		const dataOffset = 16 + alignedHeaderSize;

		const headerBuf = Buffer.alloc(headerStringSize);
		fs.readSync(fd, headerBuf, 0, headerStringSize, 16);
		const header = JSON.parse(headerBuf.toString('utf8'));

		const postConfigRelPath = 'drawio/src/main/webapp/js/PostConfig.js';
		const postConfigNode = getFileNode(header, postConfigRelPath);
		if (!postConfigNode)
		{
			throw new Error(`Could not find ${postConfigRelPath} in ${inputPath}`);
		}

		// Read existing PostConfig.js
		const origPostConfigBuf = Buffer.alloc(postConfigNode.size);
		fs.readSync(fd, origPostConfigBuf, 0, postConfigNode.size, dataOffset + parseInt(postConfigNode.offset, 10));
		let postConfigText = origPostConfigBuf.toString('utf8');

		// Strip any previous injection if re-patching
		const startIdx = postConfigText.indexOf(MARKER_START);
		const endIdx = postConfigText.indexOf(MARKER_END);
		if (startIdx !== -1 && endIdx !== -1)
		{
			postConfigText = postConfigText.slice(0, startIdx).trimEnd() + '\n';
		}

		const newPostConfigText =
			postConfigText.trimEnd() +
			'\n\n' +
			MARKER_START + '\n' +
			pluginCode.trim() + '\n' +
			MARKER_END + '\n';

		const newPostConfigBuf = Buffer.from(newPostConfigText, 'utf8');
		const pluginBuf = Buffer.from(pluginCode, 'utf8');

		// Read existing payload up to maxUsedPayloadOffset (excludes stale appended bytes from prior patches)
		// First reset nodes we are replacing so maxUsedPayloadOffset only reflects other files
		const pluginsRelPath = 'drawio/src/main/webapp/plugins/vsdx.js';
		delete postConfigNode.offset;
		delete postConfigNode.size;
		const pluginsDirNode = getFileNode(header, 'drawio/src/main/webapp/plugins');
		if (pluginsDirNode && pluginsDirNode.files && pluginsDirNode.files['vsdx.js'])
		{
			delete pluginsDirNode.files['vsdx.js'];
		}

		const existingPayloadSize = getMaxPayloadOffset(header);

		// Assign new offsets at the end of the existing payload
		const newPostConfigOffset = existingPayloadSize;
		const newPluginOffset = newPostConfigOffset + newPostConfigBuf.length;

		setFileNode(header, postConfigRelPath, {
			size: newPostConfigBuf.length,
			offset: String(newPostConfigOffset),
			integrity: computeIntegrity(newPostConfigBuf)
		});

		setFileNode(header, pluginsRelPath, {
			size: pluginBuf.length,
			offset: String(newPluginOffset),
			integrity: computeIntegrity(pluginBuf)
		});

		// Serialize new header with 4-byte alignment padding
		const newHeaderJson = JSON.stringify(header);
		const newHeaderStrLen = Buffer.byteLength(newHeaderJson, 'utf8');
		const padding = (4 - (newHeaderStrLen % 4)) % 4;
		const newAlignedHeaderSize = newHeaderStrLen + padding;

		const newHeaderPreamble = Buffer.alloc(16 + newAlignedHeaderSize);
		newHeaderPreamble.writeUInt32LE(4, 0);
		newHeaderPreamble.writeUInt32LE(newAlignedHeaderSize + 8, 4);
		newHeaderPreamble.writeUInt32LE(newAlignedHeaderSize + 4, 8);
		newHeaderPreamble.writeUInt32LE(newHeaderStrLen, 12);
		newHeaderPreamble.write(newHeaderJson, 16, newHeaderStrLen, 'utf8');

		const tmpOutputPath = outputPath + '.tmp-' + process.pid;
		const outFd = fs.openSync(tmpOutputPath, 'w');
		try
		{
			// 1. Write new header preamble + JSON
			fs.writeSync(outFd, newHeaderPreamble, 0, newHeaderPreamble.length, 0);

			// 2. Stream existing payload in 4MB chunks
			const chunkBuf = Buffer.alloc(Math.min(BLOCK_SIZE, existingPayloadSize));
			let remaining = existingPayloadSize;
			let readPos = dataOffset;
			let writePos = newHeaderPreamble.length;

			while (remaining > 0)
			{
				const toRead = Math.min(chunkBuf.length, remaining);
				const bytesRead = fs.readSync(fd, chunkBuf, 0, toRead, readPos);
				if (bytesRead <= 0) break;
				fs.writeSync(outFd, chunkBuf, 0, bytesRead, writePos);
				readPos += bytesRead;
				writePos += bytesRead;
				remaining -= bytesRead;
			}

			// 3. Append new PostConfig.js and plugins/vsdx.js
			fs.writeSync(outFd, newPostConfigBuf, 0, newPostConfigBuf.length, writePos);
			writePos += newPostConfigBuf.length;
			fs.writeSync(outFd, pluginBuf, 0, pluginBuf.length, writePos);
		}
		finally
		{
			fs.closeSync(outFd);
		}

		fs.renameSync(tmpOutputPath, outputPath);
	}
	finally
	{
		fs.closeSync(fd);
	}
}

function main()
{
	const args = process.argv.slice(2);
	let restore = false;
	let outputPath = null;
	let asarPath = null;

	for (let i = 0; i < args.length; i++)
	{
		if (args[i] === '--restore')
		{
			restore = true;
		}
		else if (args[i] === '--output' && i + 1 < args.length)
		{
			outputPath = args[++i];
		}
		else if (!args[i].startsWith('-'))
		{
			asarPath = args[i];
		}
	}

	if (!asarPath)
	{
		asarPath = findDefaultAsarPath();
	}

	if (!fs.existsSync(asarPath))
	{
		console.error(`Error: Could not find app.asar at ${asarPath}`);
		console.error('Usage: sudo node scripts/patch-desktop-asar.js [/path/to/app.asar]');
		process.exit(1);
	}

	const backupPath = asarPath + '.bak';

	if (restore)
	{
		if (!fs.existsSync(backupPath))
		{
			console.error(`Error: Backup file not found at ${backupPath}`);
			process.exit(1);
		}
		fs.copyFileSync(backupPath, asarPath);
		console.log(`Restored original ${asarPath} from ${backupPath}`);
		return;
	}

	const pluginPath = path.join(__dirname, '..', 'dist', 'visio-export-plugin.js');
	if (!fs.existsSync(pluginPath))
	{
		require('./build-plugin.js');
	}
	const pluginCode = fs.readFileSync(pluginPath, 'utf8');

	const targetPath = outputPath || asarPath;

	try
	{
		if (!outputPath && !fs.existsSync(backupPath))
		{
			fs.copyFileSync(asarPath, backupPath);
			console.log(`Created backup at ${backupPath}`);
		}

		patchAsar(asarPath, targetPath, pluginCode);
		console.log(`Successfully patched ${targetPath} with the fixed VSDX exporter!`);
		console.log('Restart draw.io Desktop and use File -> Export as -> VSDX...');
	}
	catch (err)
	{
		if (err && (err.code === 'EACCES' || err.code === 'EPERM'))
		{
			console.error(`Permission denied writing to ${targetPath}.`);
			console.error(`Run with your node binary path under sudo:\n  sudo "${process.execPath}" ${path.relative(process.cwd(), __filename)} ${asarPath}`);
			process.exit(1);
		}
		throw err;
	}
}

if (require.main === module)
{
	main();
}

module.exports = { patchAsar, computeIntegrity };
