---
created: 2025-01-26 16:42
tags:
  - zet
  - kubernetes
  - etcd
---
#### Sunday, January 26, 2025
---
ETCDCTL is the CLI tool used to interact with ETCD.ETCDCTL can interact with ETCD Server using 2 API versions – Version 2 and Version 3. By default it’s set to use Version 2. Each version has different sets of commands.

**version 2 and version 3 both are different ins terms of CLI tools and also, we can export the backup and give the key value pair as an input**

For example, ETCDCTL version 2 supports the following commands:

```
etcdctl backup
etcdctl cluster-health
etcdctl mk
etcdctl mkdir
etcdctl set
```

Whereas the commands are different in version 3

```
etcdctl snapshot save
etcdctl endpoint health
etcdctl get
etcdctl put
```

To set the right version of API set the environment variable ETCDCTL_API command

```
export ETCDCTL_API=3
```

When the API version is not set, it is assumed to be set to version 2. And version 3 commands listed above don’t work. When API version is set to version 3, version 2 commands listed above don’t work.

Apart from that, you must also specify the path to certificate files so that ETCDCTL can authenticate to the ETCD API Server. The certificate files are available in the etcd-master at the following path. We discuss more about certificates in the security section of this course. So don’t worry if this looks complex:

```
--cacert /etc/kubernetes/pki/etcd/ca.crt
--cert /etc/kubernetes/pki/etcd/server.crt
--key /etc/kubernetes/pki/etcd/server.key
```

So for the commands, I showed in the previous video to work you must specify the ETCDCTL API version and path to certificate files. Below is the final form:

```
kubectl exec etcd-controlplane -n kube-system -- sh -c "ETCDCTL_API=3 etcdctl get / \
  --prefix --keys-only --limit=10 / \
  --cacert /etc/kubernetes/pki/etcd/ca.crt \
  --cert /etc/kubernetes/pki/etcd/server.crt \
  --key /etc/kubernetes/pki/etcd/server.key"
```

#### Kubernetes API server

It is the main component of the Kubernetes master. It is used to serve the requested information. as the main usage are as below. which are listed below.

1. Authenticate user
2. Validate request
3. Retrieve data
4. update ETCD
5. Scheduler
6. Kubelet

#### Kubernetes controller

controller is an manager of the ship ( Kubernetes server ), where it is responsible for managing and controlling the processes.

It use `kube-api server ` to monitor the node and their status and watch the 

**Node controller :** it the check the status of the nodes in every `5 seconds `

![[Pasted image 20250126174256.png]]

After, not reachable a node have `40s` to response back otherwise that particular node will be considered as unreachable and get `5m` eviction time to respond back, if it doesn't then controller will mark the node inactive and remove the assigned pods from that container.

![[Pasted image 20250126174801.png]]

**Note :** *all Kubernetes controller is being packaged and managed by `kubernetes controller manager` which contains controllers i.e. *

#### kube-scheduler

iska only yeh kam h ki konsa pod kid node mein jayega when kubelet give instruction.

#### kube proxy
It only lives in the memory of the cluster, not on any pods or container. 
- runs on each node.
- create appropriate rule for deployments and node to forward and route the traffic.

### Pods

It is an single instance of an object of smallest unit of an deployment. as during deployment container are encapsulated in the Kubernetes object which is called a pod.

**pods have 1:1 relationship with the containers.**

a single can have multiple containers.  as to scale the application we add additional pods and remove ( :LiArrowDown: ) for scale down.
