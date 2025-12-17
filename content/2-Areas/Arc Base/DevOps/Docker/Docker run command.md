2025-01-20

### What is docker ?
My Raw definition

> Docker is an containerization tool which uses the same host but isolate the systems to run them without any issue of compatibility.

docker tag can be used to search for specific version or image, ham isko hamari image ki versioning ke liye bhi use kr sakte h.

### Docker run command with advance use cases

1. docker run with tags
	This will load the image with version 17 and run prints the output of the version
```
docker run ubuntu:17.10 cat /etc/*release*
```

***attach and detach means and usage.***
sleep flag can be used. e.g.
`docker run ubuntu sleep 1500`

-d = it is used for detached mode it simply run the image in the detached mode which runs in the background with that command.

`docker run -d ubuntu app.py`

to attached 