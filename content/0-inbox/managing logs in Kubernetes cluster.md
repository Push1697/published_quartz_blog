---
created: 2025-02-03 20:39
tags:
  - zet
  - kubernetes
  - kubernetes-logging
---
#### Monday, February 03, 2025
---
### Monitor cluster components

`kubctl top node`

> provide cpu usage by all nodes

```
kubectl logs -f event-simulator-pod container_name
```

#### syntax of kubectl logs of specific container

```
kubectl logs -f <pod_name> <container_name> # continer name is in case when there are mutliple pods.
```

