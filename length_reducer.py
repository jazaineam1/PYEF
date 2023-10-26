#!/usr/bin/env python3
import sys

def main():
    current_length = None
    current_count = 0

    for line in sys.stdin:
        length, count = line.strip().split("\t")
        length = int(length)
        count = int(count)

        if current_length is None:
            current_length = length

        if length != current_length:
            print(f"{current_length}\t{current_count}")
            current_length = length
            current_count = 0

        current_count += count

    if current_length is not None:
        print(f"{current_length}\t{current_count}")

if __name__ == "__main__":
    main()
