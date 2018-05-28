MAKEFLAGS += --warn-undefined-variables
SHELL := /bin/bash

TAG?=latest

.PHONY: build

build:
    triton-compose build

run:
    triton profile set-current lantern
    triton-compose up -d