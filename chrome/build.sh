#!/bin/sh
MOD_NAME="fe-helper"

#把需要的文件都copy到相应的目录下
rm -rf output && mkdir output
cp -r static output/
cp -r _locales output/
cp online.manifest.json output/manifest.json

#下载fcp代码，开始编译
rm -rf fcp*
cp /Users/zhaoxianlie/sourceCode/fcp/release/fcp.tar.gz . > /dev/null
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

# 扫描所有的文件
function scandir(){

    for f in $(ls $1) ;do
        abspath=$1"/"$f
        if [[ -d $abspath ]];then
            scandir $abspath
        elif [[ -f $abspath ]];then
            echo $abspath
        fi
    done
}

# 冗余文件清理
cd output/fe-helper
rootpath=$(pwd)
cd static
# 待清理的目录
cleandir="js css img"
for d in $cleandir;do

    thefiles=$(scandir $d)

    for f in $thefiles;do
        result=$(grep $f -rl $rootpath)
        if [[ x"$result" == x ]];then
            rm -f $f
            echo "清理文件成功：static/$f"
        fi
    done
done

#生成zip包
cd $rootpath/../
zip -r $MOD_NAME.zip $MOD_NAME/ > /dev/null

echo ""
echo "生成压缩包成功，可发布到Chrome web store了！"
