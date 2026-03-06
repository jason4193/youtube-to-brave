#!/usr/bin/env python3
import os
import sys
import struct
import json
import subprocess
from pathlib import Path

VERSION = "1.0.0"

LOG = Path.home() / "youtube_redirect_debug.log"

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
        with LOG.open("a") as file:
            file.write(" ".join(map(str, parts)) + "\n")
    except Exception:
        pass


def read_message():
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
    except Exception as error:
        log("JSON decode error:", error)
        return None


def validate_url_scheme(url):
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
        message = read_message()
        if message is None:
            break

        log("Input received:", message)

        if message.get("action") == "version":
            log("Version check requested")
            try:
                response = json.dumps({"status": "ok", "version": VERSION}).encode("utf-8")
                sys.stdout.buffer.write(struct.pack("<I", len(response)))
                sys.stdout.buffer.write(response)
                sys.stdout.buffer.flush()
                log("Sent version response:", VERSION)
            except Exception as error:
                log("Failed to write version response:", error)
            continue

        url = message.get("url")
        if not url:
            log("No URL field in message")
            continue

        if not validate_url_scheme(url):
            log("Invalid URL scheme, rejecting:", url)
            continue

        log("URL extracted:", url)

        try:
            response = json.dumps({"status": "ok", "url": url}).encode("utf-8")
            sys.stdout.buffer.write(struct.pack("<I", len(response)))
            sys.stdout.buffer.write(response)
            sys.stdout.buffer.flush()
            log("Sent response to extension for:", url)
        except Exception as error:
            log("Failed to write response to stdout:", error)

        try:
            subprocess.run(["open", "-a", "Brave Browser", url], check=True)
            log("Opened in Brave:", url)
        except Exception as error:
            log("Failed to open Brave:", error, url)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        log("Unhandled error in native host:", error)
