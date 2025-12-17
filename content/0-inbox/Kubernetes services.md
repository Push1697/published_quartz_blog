---
created: 2025-01-27 19:21
tags:
  - zet
  - kubernetes
  - kubernetes-service
---
#### Monday, January 27, 2025
---
# What is a service ?
In layman terms I understood till now that it is an Kubernetes object which is used to make the deployments, pods, replica sets ***( rs )*** connect from outside the world. i.e. using the services you can connect with your application running in a pods on port 3333.
## Types of service

| NodePort | ClusterIP | LoadBalancer |
| :------: | --------- | ------------ |


![[Pasted image 20250127192554.png]]
### NodePort
External access to running application in a pods on a port

![[Pasted image 20250127210129.png]]
Port is ==> 30008 is because ==NodePort== port range between 30000 - 32767

A sample NodePort definition YAML file.
```
apiVersion: v1
kind: Service
metadata:
	name: myapp-service

spec:
	type: NodePort
	ports:
	 - targetPort: 80
	   port : 80
	   nodeport: 30008 # if we do not provide this value then a free port will be automatically assigned.
	selector:
		app: myapp
		type: front-end
```

Now after creating the above sample NodePort service, it's time to create the service. you can follow the below command to create the NodePort service in Kubernetes.
```
kubectl create -f NodePort-definition.yaml
```

**Now there is an question, that above definition file is only for one pod. what if there are multiple pods for scalability purposes.**

> The answer is `labels` & `selectors` will work for them. when we will create the service it will automatically look for the pods of which contains the labels. in our above case is `myapp`

**Note :** Also, similarly services are created across the nodes. as soon the pods scale up service will connect with them or vice-versa.
