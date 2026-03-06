#!/opt/homebrew/bin/python3
import os
import sys
import struct
import json
import subprocess
from pathlib import Path

LOG = Path.home() / "youtube_redirect_debug.log"

# Debug enabled when environment variable YTB_DEBUG=1 or
# when a flag file exists at ~/.youtube_redirect_debug_enabled
DEBUG = False
if os.environ.get("YTB_DEBUG", "0") == "1":
	DEBUG = True
else:
	try:
		DEBUG = (Path.home() / ".youtube_redirect_debug_enabled").exists()
	except Exception:
		DEBUG = False

def log(*parts):
	if not DEBUG:
		return
	try:
		with LOG.open("a") as f:
			f.write(" ".join(map(str, parts)) + "\n")
	except Exception:
		# avoid raising in native host
		pass

def read_message():
	# Read 4 bytes for message length (little-endian)
	raw_length = sys.stdin.buffer.read(4)
	if len(raw_length) == 0:
		return None
	if len(raw_length) < 4:
		log("Incomplete length header received")
		return None
	message_length = struct.unpack("<I", raw_length)[0]
	message_bytes = sys.stdin.buffer.read(message_length)
	if len(message_bytes) < message_length:
		log("Incomplete message body received")
		return None
	try:
		return json.loads(message_bytes.decode("utf-8"))
	except Exception as e:
		log("JSON decode error:", e)
		return None

def validate_url_scheme(url):
	"""Validate that URL has safe scheme (http or https)"""
	try:
		parsed = url.split("://", 1)
		if len(parsed) < 2:
			return False
		scheme = parsed[0].lower()
		return scheme in ("http", "https")
	except Exception:
		return False

def main():
	log("Native host started")
	while True:
		msg = read_message()
		if msg is None:
			break
		log("Input received:", msg)
		url = msg.get("url")
		if not url:
			log("No URL field in message")
			continue
		
		# Validate URL scheme for security
		if not validate_url_scheme(url):
			log("Invalid URL scheme, rejecting:", url)
			continue
		
		log("URL extracted:", url)
		# Send a short JSON response back to the extension quickly
		try:
			resp = json.dumps({"status": "ok", "url": url}).encode("utf-8")
			sys.stdout.buffer.write(struct.pack("<I", len(resp)))
			sys.stdout.buffer.write(resp)
			sys.stdout.buffer.flush()
			log("Sent response to extension for:", url)
		except Exception as e:
			log("Failed to write response to stdout:", e)
		# Now open Brave (do this after sending response so the extension receives confirmation fast)
		try:
			subprocess.run(["open", "-a", "Brave Browser", url], check=True)
			log("Opened in Brave:", url)
		except Exception as e:
			log("Failed to open Brave:", e, url)

if __name__ == "__main__":
	try:
		main()
	except Exception as e:
		log("Unhandled error in native host:", e)
