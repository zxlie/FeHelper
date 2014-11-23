/**
 * 图片base 64编码
 * @author xianliezhao
 */
var ImageBase64 = (function () {

    var _getDataUri = function (file) {
        var reader = new FileReader();
        reader.onload = function (evt) {
            $('#result').val(evt.target.result);
            $('#preview').attr('src', evt.target.result).show();
            $('td .x-panel').css('background-image', 'none');
        };
        reader.readAsDataURL(file);
    };

    var _bindEvent = function () {
        $('textarea').bind('click', function (e) {
            this.select();
        });

        var $file = $('#file').change(function (e) {
            if (this.files.length) {
                _getDataUri(this.files[0]);
                this.value = '';
            }
        });

        $('#upload').click(function (e) {
            e.preventDefault();
            $file.trigger('click');
        });

        $(document).bind('drop',function (e) {
            e.preventDefault();
            e.stopPropagation();
            var files = e.originalEvent.dataTransfer.files;
            if (files.length) {
                if (/image\//.test(files[0].type)) {
                    _getDataUri(files[0]);
                } else {
                    alert('请选择图片文件！');
                }
            }
        }).bind('dragover', function (e) {
                e.preventDefault();
                e.stopPropagation();
            });
    };

    $(function () {
        _bindEvent();
    });
})();