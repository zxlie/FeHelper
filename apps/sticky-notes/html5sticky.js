/*
   HTML5STICKY (http://github.com/sarfraznawaz2005/HTML5Sticky)
   ================================================================
   Author   : Sarfraz Ahmed (sarfraznawaz2005@gmail.com)
   Twitter  : @sarfraznawaz
   Blog     : http://sarfraznawaz.wordpress.com/
   LICENSE  : MIT
   ================================================================

   @updated zhaoxianlie
*/

let stickywidth = 220;  // width of sticky note (can't be less than 200)
let stickyheight = 200; // height of sticky note (can't be less than 200)
let max_notes = 10000; // maximum number of notes one can store
let allowed_tags = '<br /><br><ol></ol><ul></ul><li></li><strong></strong><i></i>';

let html5sticky = {};
const STICKYNOTES_ALLKEYS = 'stickynotes|allkeys';

// add a note
html5sticky.addNote = function () {

    // count total present notes
    let tnotes = $('.note_common').length;

    if (tnotes === max_notes) {
        html5sticky.showMessage('#FFE16B', 'black', '当前便签笔记已经足够多了，不能再添加了！');
        return false;
    }

    // unique localstorage identifier for this sticky note
    let nindex = 'stickynote_' + (new Date * 1);

    let dated = getDateTime();
    let dateStr = new Date();

    // get random color
    let bgcolor = html5sticky.getColor();

    let stickynote = $('<div class="note_common ' + bgcolor + '" />').appendTo($('#main'));
    // add tape to stickynote
    html5sticky.addPin(stickynote);

    $(stickynote).append($('<h2>' + dated + '</h2>'));
    $(stickynote).append($('<p></p>'));
    // append identifier
    $(stickynote).append($('<span id="idf_' + nindex + '" />'));

    // set width and height of the sticky note
    $('.note_common').css({width: stickywidth + 'px', height: stickyheight + 'px'});

    $('.note_common p').css({height: (stickyheight - 60) + 'px', width: (stickywidth + 9) + 'px'});

    if (!$("#removenotes").is(':visible')) {
        $('#removenotes').slideDown('slow');
    }

    // scroll to newly added sticky note
    $('html, body').animate({
        scrollTop: $(stickynote).offset().top
    });

    // 先存key，再存数据
    let allKeys = (localStorage.getItem(STICKYNOTES_ALLKEYS) || '').split(',');
    allKeys.push(nindex + '|text');
    allKeys.push(nindex + '|bgcolor');
    allKeys.push(nindex + '|dated');
    localStorage.setItem(STICKYNOTES_ALLKEYS, allKeys.join(','));

    // 存数据
    localStorage.setItem(nindex, nindex);
    localStorage.setItem(nindex + '|text', $(stickynote).find('h2').text() + '|' + $(stickynote).find('p').text());
    localStorage.setItem(nindex + '|bgcolor', bgcolor);
    localStorage.setItem(nindex + '|dated', dated + '|' + getISODateTime(dateStr));

    html5sticky.enlargeNote(stickynote);
};

// save note
html5sticky.saveNote = function (el) {

    let identifier = html5sticky.getIdentifier($(el));
    let htext = html5sticky.stripTags($(el).closest('.bignote').find('.hedit')[0].value, allowed_tags);
    let ptext = html5sticky.stripTags($(el).closest('.bignote').find('.pedit')[0].value, allowed_tags);
    ptext = ptext.replace(/\r?\n/g, '<br />');

    localStorage.setItem(identifier + '|text', htext + '|' + ptext);

    $('[id^=idf_' + identifier + ']').closest('.note_common').find('h2').text(htext);
    $('[id^=idf_' + identifier + ']').closest('.note_common').find('p').html(ptext);

    html5sticky.showMessage('#9BED87', 'black', '笔记保存成功！');

};

// get note identifier
html5sticky.getIdentifier = function (el) {
    let identifier = $(el).closest('.bignote').find('[id^=idf_]').attr('id');

    if (typeof identifier == 'undefined' || identifier == null) {
        identifier = $(el).closest('.note_common').find('[id^=idf_]').attr('id');
    }

    if (typeof identifier != 'undefined') {
        identifier = identifier.replace('idf_', '');
        return identifier;
    }
    else {
        return false;
    }
};


// delete note
html5sticky.deleteNote = function (el) {
    if (confirm('确定要删除这个便签笔记吗，一旦删除则不可恢复，请三思?')) {


        let identifier = html5sticky.getIdentifier($(el));
        localStorage.removeItem(identifier);
        localStorage.removeItem(identifier + '|text');
        localStorage.removeItem(identifier + '|bgcolor');
        localStorage.removeItem(identifier + '|dated');

        let allKeys = (localStorage.getItem(STICKYNOTES_ALLKEYS) || '').split(',');
        ['text', 'bgcolor', 'dated'].forEach(function (item) {
            let id = identifier + '|' + item;
            allKeys.indexOf(id) > -1 && allKeys.splice(allKeys.indexOf(id), 1);
        });
        localStorage.setItem(STICKYNOTES_ALLKEYS, allKeys.join(','));

        $(el).closest('.note_common').fadeOut('slow', function () {
            $(el).closest('.note_common').remove();

            if (!$(".note_common").length > 0) {
                $('#removenotes').slideUp('slow');
            }

        });
    }
};

// delete all notes
html5sticky.deleteAllNotes = function () {
    if (confirm('确定要删除所有笔记吗，一旦删除则不可恢复，请三思?')) {
        $('.note_common').fadeOut('slow', function () {
            $('.note_common').remove();
            let allKeys = (localStorage.getItem(STICKYNOTES_ALLKEYS) || '').split(',');
            allKeys.forEach(function (key) {
                localStorage.removeItem(key);
            });
            localStorage.removeItem(STICKYNOTES_ALLKEYS);
        });
    }
};


// close big note
html5sticky.closeNote = function (el) {
    $(el).closest('.bignote')[html5sticky.getAnimation(true)]('slow', function () {
        $('#overlay').remove();
    });
};

// edit note
html5sticky.editNote = function ($clone, el) {
    let ptext = $clone.find('p').html();
    ptext = ptext.replace(/(<br \/>|<br>)/g, '\n');
    $clone.find('p').replaceWith('<textarea class="pedit" placeholder="在这里添加笔记" />');

    $clone.find('.pedit')
        .val(ptext)
        .css({
            'marginTop': '5px',
            'resize': 'none',
            'outline': 'none'
        })
        .addClass('inset')
        .width('568px')
        .height('280px');

    // make content editable
    let htext = $clone.find('h2').text();
    $clone.find('h2').replaceWith('<input type="text" class="hedit" />');

    $('.hedit').addClass('inset').val(html5sticky.stripTags(htext, allowed_tags)).width(250);


    // put in Close button
    $('<a href="#" class="close_stickynote"><img src="./img/delete.png" alt="" title="关闭笔记"></a>')
        .css({
            position: 'absolute',
            top: 7,
            right: 5
        })
        .appendTo($clone);

    // put in Save button
    $('<a href="#" class="save_stickynote"><img src="./img/save.png" alt="" title="保存笔记"></a>')
        .css({
            position: 'absolute',
            top: 5,
            right: 50
        })
        .appendTo($clone);
};

// get all notes
html5sticky.getNotes = function () {

    let allKeys = (localStorage.getItem(STICKYNOTES_ALLKEYS) || '').split(',');
    allKeys.forEach(key => {

        if (!/\|text/.test(key)) {
            return false;
        }

        let id = key.replace('|text', '');
        let stickynote, bgcolor, htext, ptext, temp_array;

        // get color and rotation level
        bgcolor = localStorage.getItem(id + '|bgcolor');

        // get text info
        temp_array = localStorage.getItem(id + '|text').split('|');
        htext = temp_array[0];
        ptext = temp_array[1];

        stickynote = $('<div class="note_common ' + bgcolor + '" />').appendTo($('#main'));
        html5sticky.addPin(stickynote);

        $(stickynote).append($('<h2></h2>'));
        $(stickynote).append($('<p></p>'));
        // append identifier
        $(stickynote).append($('<span id="idf_' + id + '" />'));

        $(stickynote).find('h2').text(html5sticky.stripTags(htext, allowed_tags));
        $(stickynote).find('p').html(html5sticky.stripTags(ptext, allowed_tags));

        // set width and height of the sticky note
        $('.note_common').css({width: stickywidth + 'px', height: stickyheight + 'px'});
        $('.note_common p').css({height: (stickyheight - 60) + 'px', width: (stickywidth + 9) + 'px'});

    });
};

// collapse notes
html5sticky.collapse = function () {
    let height = parseInt($('.note_common:first').find('h2').height() || 0, 10) + 'px';

    $('.note_common').animate({height: height}, function () {
        $('.note_common').find('p').hide();
    });
};

// expand notes
html5sticky.expand = function () {
    $('.note_common').animate({height: stickyheight}, function () {
        $('.note_common').find('p').fadeIn('slow');
    });
};


// share note
html5sticky.showMessage = function (bgcolor, color, msg) {
    if (!$('#smsg').is(':visible')) {
        $('html, body').animate({
            scrollTop: 0
        }, 500, function () {
            if (!$('#smsg').length) {
                $('<div id="smsg">' + msg + '</div>').appendTo($('body')).css({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '40px',
                    lineHeight: '40px',
                    background: bgcolor,
                    color: color,
                    zIndex: 1000,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    opacity: 0.9,
                    margin: 'auto',
                    display: 'none'
                }).slideDown('show');

                setTimeout(function () {
                    $('#smsg').animate({'width': 'hide'}, function () {
                        $('#smsg').remove();
                    });
                }, 2000);
            }
        });
    }
};

// get random color
html5sticky.getColor = function () {
    let text = "";
    let possible = "0123456789";

    text += possible.charAt(Math.floor(Math.random() * possible.length));
    return 'stickynote' + text;
};


// get random animation string
html5sticky.getAnimation = function (hideAnimation) {
    let words = [];

    if (typeof hideAnimation !== 'undefined') {
        words[1] = "hide";
        words[2] = "fadeOut";
        words[3] = "slideUp";
    }
    else {
        words[1] = "show";
        words[2] = "fadeIn";
        words[3] = "slideDown";
    }

    // Generate a random number between 1 and 3
    let rnd = Math.ceil(Math.random() * 3);

    return words[rnd];
};


// add pin to note
html5sticky.addPin = function (el) {
    let close = $('<div class="btn-close"><a href="#" class="delete_stickynote"><img src="./img/delete.png" width="24" alt="" title="删除笔记"></a></div>');
    let tag = $('<div align="center"><img src="./img/pin.png" alt="" title="关闭"></div>');

    $(close).css({
        position: 'absolute',
        top: -15,
        right: -15
    }).hide().prependTo($(el));

    $(tag).css({
        position: 'absolute',
        zIndex: 99,
        top: -15,
        left: parseInt(stickywidth / 2, 10) - 10
    }).prependTo($(el));
};

// enlarge note for editing
html5sticky.enlargeNote = function (el) {
    $this = $(el);

    // create overlay
    $('<div id="overlay" />').css({
        position: 'fixed',
        background: 'rgba(0,0,0,0.5)',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '100'
    }).appendTo($('body'));

    $clone = $(el).clone().removeClass('note_common').addClass('bignote').appendTo($('#overlay'));

    // remove the pin
    $clone.find($('img[src*="pin.png"]').closest('div')).hide();
    // change delete button title
    $clone.find($('img[src*="delete.png"]').closest('div')).hide();

    $($clone).css({
        position: 'absolute',
        zIndex: 500,
        cursor: 'default',
        paddingTop: '5px',
        width: '600px',
        height: '376px',
        top: '50%',
        left: '50%',
        display: 'none',
        marginLeft: '-300px',
        marginTop: '-200px'
    });

    $($clone)[html5sticky.getAnimation()](400);

    // add date and time info
    let dateStr = '', dateAgo = '';


    let identifier = html5sticky.getIdentifier($(el));
    let dateTime = localStorage.getItem(identifier + '|dated');
    let timeImg = '<img class="left" align="absmiddle" src="./img/time.png">';

    dateStr = dateTime.split('|')[0];
    dateAgo = prettyDate(dateTime.split('|')[1]);

    dateStr = (dateStr.length > 0) ? '创建于：' + dateStr : '';
    dateAgo = (dateAgo.length > 0) ? ' (' + dateAgo + ')' : '';
    timeImg = (dateStr.length > 0) ? timeImg : '';


    $('<div class="timeago left" />').prependTo($clone);
    $('.timeago').css({fontSize: '12px', fontFamily: 'tahoma'})
        .html(timeImg + '&nbsp;&nbsp;' + dateStr + dateAgo)
        .after('<div class="clear" />');

    // hide the utility buttons
    $($clone).find('.icons-footer').hide();

    // make content editable
    html5sticky.editNote($clone, el);
};

html5sticky.setup = function () {

    let fontFamily = $('.note_common p').css('font-family');

    // Architects font needs to have lesser line height / spacing for lists
    if (typeof fontFamily !== 'undefined' && fontFamily.indexOf('Architects') >= 0) {
        $('.note_common ul').css({lineHeight: '10px', padding: '0px', margin: '0px'});
        $('.note_common ol').css({lineHeight: '0px', padding: '0px', margin: '0px'});
    }

    // sticky notes can't be less than 200x200
    if (stickywidth < 200) {
        stickywidth = 200;
    }

    if (stickyheight < 200) {
        stickyheight = 200;
    }
};

// http://phpjs.org/functions/strip_tags:535
html5sticky.stripTags = function (input, allowed) {
    allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
    let tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
        commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    });
};

// 全部notes导出到本地
html5sticky.export = function () {

    chrome.permissions.request({
        permissions: ['downloads']
    }, (granted) => {
        if (granted) {

            let allKeys = (localStorage.getItem(STICKYNOTES_ALLKEYS) || '').split(',');
            let zipper = null;
            if (allKeys.length) {
                zipper = new JSZip();
            }
            allKeys.forEach(key => {

                if (!/\|text/.test(key)) {
                    return false;
                }

                let id = key.replace('|text', '');
                let dated, htext, ptext, temp_array;

                dated = localStorage.getItem(id + '|dated');

                // get text info
                temp_array = localStorage.getItem(id + '|text').split('|');
                htext = temp_array[0];
                ptext = temp_array[1];

                zipper.file(htext + '.txt', [
                    '# title：' + htext,
                    '# date：' + dated,
                    '# content：\n' + ptext
                ].join('\n\n'));
            });

            if (zipper) {
                zipper.generateAsync({type: "blob"})
                    .then(function (content) {
                        chrome.downloads.download({
                            url: URL.createObjectURL(new Blob([content], {type: 'application/octet-stream'})),
                            saveAs: true,
                            conflictAction: 'overwrite',
                            filename: 'fehelper-sticky-notes-' + (new Date*1) + '.zip'
                        });
                    });
            }
        } else {
            alert('必须接受授权，才能正常下载！');
        }
    });
};