2025-01-20

Install python in an existing cPanel server - _**as cPanel comes with the python 2.XX which is used for mailman and yum**_. Hence, we can’t upgrade the Python version as it may break the current cPanel setup.
As we are installing the latest Python from source, we need to install the development tools and the libraries for the proper functioning of the latest Python version.


```
yum update

yum groupinstall "development tools"

yum install tk-devel gdbm-devel db4-devel libpcap-devel xz-devel expat-devel readline-devel lib-devel bzip2-devel openssl-devel ncurses-devel sqlite-devel libffi-devel
```

Once the prerequisites installed, we can go ahead and install Python 3

#### Install Python 3 from Source

Download the latest version of Python from here: [https://www.python.org/ftp/python/](https://www.python.org/ftp/python/)

```
cd /usr/local/src

wget https://www.python.org/ftp/python/3.7.2/Python-3.7.2.tgz

tar xzf Python-3.7.2.tgz

cd Python-*

./configure --prefix=/usr/local/python3.7 --enable-shared LDFLAGS="-Wl,-rpath /usr/local/lib"

make

make altinstall
```

_**Please make sure that you run make altinstall instead of make install. The make install command will break the existing Python installation.**_

To get Python 3.7 globally upon login, you need to update the library path like below:

Create a file python3.7.sh:
```
vim /etc/profile.d/python3.7.sh
```

Add the following into it:
```
PATH=$PATH:/usr/local/python3.7/bin

export PATH
```

Also, create another file opt-python3.6.conf
```
vim /etc/ld.so.conf.d/opt-python3.7.conf
```

Add the following into it:
```
/usr/local/python3.7/lib
```
Run the following commands to create the necessary links and cache to the most recent shared libraries found in the directories specified on the command line.

```
ldconfig

source /etc/profile.d/python3.7.sh
```

It will complete the Python 3 setup and you can verify the both Python installation using the following commands:

**Base Python installation:**
```
python -V
```

Example Output:
```
[root@grepit ~]# python -V

Python 2.7.5

[root@grepit ~]#
```

**Python 3.7 installation:**
```
python3.7 -V
```

Example Output:
```
[root@grepit ~]# python3.7 -V

Python 3.7.2

[root@grepit ~]#
```
That’s it!



References
>[[https://grepitout.com/how-install-python-3-cpanel-server/]]
>[[https://grepitout.com/|Grepitout.com]]
