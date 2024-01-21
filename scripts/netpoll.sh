#!/bin/sh
iwconfig wlan0 | grep Link | sed 's/\/100//g' | tr '=' ' ' | awk '{printf $3}' | cut -d "/" -f 1