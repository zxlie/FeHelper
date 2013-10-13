#!/bin/sh
MOD_NAME="fe-helper"

#把需要的文件都copy到相应的目录下
rm -rf output && mkdir output
cp -r static output/
cp manifest.xml default.ico default-big.png output/

#下载fcp代码，开始编译
rm -rf fcp*
cp /Users/zhaoxianlie/mycode/fcp/release/fcp.tar.gz . > /dev/null
tar zxf fcp.tar.gz > /dev/null
php fcp/index.php $MOD_NAME

#如果有错，则没有产物
if [[ -f "fcp/error.log" ]];then
	rm -rf fcp*
	rm -rf output
	exit 1;
fi
rm -rf fcp*

#删掉svn目录
cd output
find . -type d -name ".svn" | xargs rm -rf
rm -rf static.uncompress
cd ../ && mv output $MOD_NAME && mkdir output && mv $MOD_NAME output

#生成sext安装文件
cd output/$MOD_NAME
zip -r $MOD_NAME.zip * > /dev/null
mv $MOD_NAME.zip ../$MOD_NAME.sext
cd ../../
