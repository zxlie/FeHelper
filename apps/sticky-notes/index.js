/**
 * 便签笔记入口程序
 * @author zhaoxianlie
 */

let StickyNotes = (() => {

    // 添加事件监听
    let addListener = () => {

        // 正在编辑中
        let editing = false;

        window.onbeforeunload = function (e) {
            if (editing) {
                (e || window.event).returnValue = '当前还有未保存的笔记，确定要离开么？';
            }
        };

        // add note
        $('#addnote').click(function () {
            editing = true;
            html5sticky.addNote();
            return false;
        });

        // delete all notes
        $('#remove').click(function () {
            html5sticky.deleteAllNotes();
            return false;
        });

        // delete all notes
        $('#donate-link').click(function (event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'sticky-notes' }
            });
            return false;
        });

        // open options page
        $('#other-tools').click(function (event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        });

        $(document.body).delegate('.delete_stickynote', 'click', function (e) {
            // delete note
            html5sticky.deleteNote($(this));
            return false;
        }).delegate('.close_stickynote', 'click', function (e) {
            editing = false;
            // close enlarged note
            html5sticky.closeNote($(this));
            return false;
        }).delegate('.save_stickynote', 'click', function (e) {
            editing = false;
            // save the note
            html5sticky.saveNote($(this));
            return false;
        }).delegate('.note_common', 'click', function (e) {
            // enlarge the note
            $(this).find('.btn-close').hide();
            html5sticky.enlargeNote($(this));
            return false;
        }).delegate('.note_common', 'mouseover', function (e) {
            // 显示关闭按钮
            $(this).find('.btn-close').show();
        }).delegate('.note_common', 'mouseout', function (e) {
            // 隐藏关闭按钮
            $(this).find('.btn-close').hide();
        });

        // collapse the notes
        $('#collapse').click(function (event) {
            html5sticky.collapse();
            return false;
        });

        // expand the notes
        $('#expand').click(function (event) {
            html5sticky.expand();
            return false;
        });

        // allow escape to close big note
        $(document).keyup(function (e) {
            if (e.keyCode === 27) {
                $('#overlay').remove();
                $('.bignore').remove();
            }
        });

        // 下载
        $('#export').click(function (e) {
            html5sticky.export();
            return false;
        });

        // 导入笔记
        $('#import').click(function (event) {
            if (confirm('仅支持再次导入【之前用本工具导出的*.zip包】，请确认zip包已准备好？')) {
                html5sticky.importNotes();
            }
            return false;
        });

        // 文件夹选中
        $('#folders').delegate('li', 'click', function (e) {
            $(this).addClass('x-selected').siblings('li').removeClass('x-selected');
            let txt = $(this).text();
            let id = $(this).attr('id').replace(/^f_/, '');
            html5sticky.setCurrentFolder(txt, id);
            html5sticky.loadNotes(id);
        });

        // 创建文件夹
        $('#createFolder').click(function (e) {
            let el = html5sticky.createFolder();
            if (el) {
                el.trigger('click');
            }
            return false;
        });
    };

    function loadPatchHotfix() {
        // 页面加载时自动获取并注入页面的补丁
        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing',
            thing: 'fh-get-tool-patch',
            toolName: 'sticky-notes'
        }, patch => {
            if (patch) {
                if (patch.css) {
                    const style = document.createElement('style');
                    style.textContent = patch.css;
                    document.head.appendChild(style);
                }
                if (patch.js) {
                    try {
                        if (window.evalCore && window.evalCore.getEvalInstance) {
                            window.evalCore.getEvalInstance(window)(patch.js);
                        }
                    } catch (e) {
                        console.error('sticky-notes补丁JS执行失败', e);
                    }
                }
            }
        });
    }

    // 初始化
    let init = () => {
        html5sticky.buildFoldersAndInitNotes();
        addListener();
        loadPatchHotfix();
    };

    return {
        init: init
    };
})();

StickyNotes.init();