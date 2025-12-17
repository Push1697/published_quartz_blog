2025-01-20

check running container list
> docker ps

check all containers under a machine
```
docker ps -a 
```

for docker detached mode insert `-d` after run as shown below
```
docker run -d image:tag command
```

for attaching the running container in the fg ( foregroud )
```
docker attach container_id
```

