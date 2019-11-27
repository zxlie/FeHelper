/**
 * FeHelper HTML转Markdown
 */
new Vue({
    el: '#pageContainer',
    data: {
        sourceContent: '',
        resultContent: '',
        previewHTML: '',
        showPreview: false,
        previewText: '效果预览',
        codeType: 'HTML',
        nextCodeType: 'Markdown',
        toolName: {
            HTML: 'HTML转Markdown',
            Markdown: 'Markdown转HTML'
        }
    },

    mounted: function () {
        this.$refs.srcText.focus();
    },
    methods: {
        convert: function () {
            let h2m = Tarp.require('../static/vendor/h2m/h2m');
            let markdown = Tarp.require('../static/vendor/h2m/markdown');
            if (this.codeType === 'HTML') {
                this.resultContent = h2m(this.sourceContent, {
                    converter: 'CommonMark' // CommonMark | MarkdownExtra
                });
                this.previewHTML = markdown.toHTML(this.resultContent);
            } else {
                this.resultContent = this.previewHTML = markdown.toHTML(this.sourceContent);
            }
        },

        preview: function (event) {
            event && event.preventDefault();
            this.showPreview = !this.showPreview;
            this.previewText = this.showPreview ? '查看源码' : '效果预览';
        },

        trans: function () {
            this.codeType = {HTML: 'Markdown', Markdown: 'HTML'}[this.codeType];
            this.nextCodeType = {HTML: 'Markdown', Markdown: 'HTML'}[this.nextCodeType];
            this.preview();
            this.clear();
        },

        clear: function () {
            this.sourceContent = '';
            this.resultContent = '';
            this.resultContent = false;
        },

        getResult: function () {
            this.$refs.rstCode.select();
        },

        setDemo: function () {
            if (this.codeType === 'HTML') {
                this.sourceContent = this.$refs.htmlDemo.innerHTML;
            } else {
                this.sourceContent = '## FE助手\n' +
                    '\n' +
                    '- 字符串编解码\n' +
                    '- `Json`串格式化\n' +
                    '- 代码美化工具\n' +
                    '- 代码压缩工具\n' +
                    '- 二维码生成器\n' +
                    '- 页面取色工具\n' +
                    '- Js正则表达式\n' +
                    '- 时间(戳)转换\n' +
                    '- 图片Base64\n' +
                    '- 编码规范检测\n' +
                    '- 页面性能检测\n' +
                    '- Html转`Markdown`\n' +
                    '- Ajax调试:**关**';
            }
            this.convert();
        },

        // 导入内容
        importContent: function () {
            let that = this;
            let fileInput = document.getElementById('fileInput');
            if (!fileInput) {
                fileInput = document.createElement('input');
                fileInput.id = 'fileInput';
                fileInput.type = 'file';
                fileInput.accept = {HTML: 'text/html', Markdown: 'text/x-markdown'}[that.codeType];
                fileInput.style.cssText = 'position:relative;top:-1000px;left:-1000px;';
                fileInput.onchange = function (event) {
                    let reader = new FileReader();
                    reader.readAsText(fileInput.files[0], 'utf-8');
                    reader.onload = (evt) => {
                        that.sourceContent = evt.target.result;
                        that.convert();
                        document.body.removeChild(fileInput);
                    };
                };
                document.body.appendChild(fileInput);
            }
            fileInput.click();
        },

        // 通过调用系统打印的形式，打印为pdf
        exportContent: function () {
            let css = `@page {
   size: 5.5in 8.5in;  
   margin: 70pt 60pt 70pt;
}

@page:first {
   size: 5.5in 8.5in;  
   margin: 0;
}

img {
  max-width: 100%;
}

div.frontcover { 
  page: cover; 
  content: url("images/cover.png");
  width: 100%;
  height: 100%; 
}



/* styles for the right hand spread
Bottom left we display the title of the book, bottom right the page using a CSS counter, top right the content of the current chapter */
@page:right{ 
   @bottom-left {
       margin: 10pt 0 30pt 0;
       border-top: .25pt solid #666;
	   content: "Our Cats";
       font-size: 9pt;
       color: #333;
   }
   @bottom-right { 
       margin: 10pt 0 30pt 0;
       border-top: .25pt solid #666;
       content: counter(page);
       font-size: 9pt;
   }
   @top-right {
   	   content:  string(doctitle);
   	   margin: 30pt 0 10pt 0;
   	   font-size: 9pt;
   	   color: #333;
   }
}

/* styles for the left hand spread 
Bottom right book title, bottom left current page */
@page:left {

   @bottom-right {
       margin: 10pt 0 30pt 0;
       border-top: .25pt solid #666;
	     content: "Our Cats";
       font-size: 9pt;
       color: #333;
   }
   @bottom-left { 
       margin: 10pt 0 30pt 0;
       border-top: .25pt solid #666;
       content: counter(page);
       font-size: 9pt;
   }
}

/* first page */
@page:first {
  @bottom-right {
    content: normal;
    margin: 0;
  }

  @bottom-left {
    content: normal;
    margin: 0;
  }
}

/* reset chapter and figure counters on the body */
body {
	counter-reset: chapternum figurenum;
	font-family: "Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", Tahoma, sans-serif;
	line-height: 1.5;
	font-size: 11pt;
}

/* get the title of the current chapter - this will be the content of the h1 
reset figure counter as figures start from 1 in each chapter */
h1 {
    string-set: doctitle content();
    page-break-before: always;
    counter-reset: figurenum;
    counter-reset: footnote;
    line-height: 1.3;
}

/* increment chapter counter */
h1.chapter:before {
    counter-increment: chapternum;
    content: counter(chapternum) ". ";
}

/* increment and display figure counter */
figcaption:before {
	counter-increment: figurenum;
	content: counter(chapternum) "-" counter(figurenum) ". ";
}

/* footnotes */
.fn {
  float: footnote;
}

.fn {
  counter-increment: footnote;
}

.fn::footnote-call {
  content: counter(footnote);
  font-size: 9pt;
  vertical-align: super;
  line-height: none;
}

.fn::footnote-marker {
  font-weight: bold;
}

@page {
  @footnotes {
    border-top: 0.6pt solid black;
    padding-top: 8pt;
  }
}

h1,h2,h3,h4,h5 {
	font-weight: bold;
	page-break-after: avoid;
	page-break-inside:avoid;
}

h1+p, h2+p, h3+p {
	page-break-before: avoid;
}

table, figure {
	page-break-inside: avoid;
}

ul.toc {
	list-style: none;
	margin: 0;
	padding: 0;
}

/* create page numbers using target-counter in the TOC */
ul.toc a::after {
  content: leader('.') target-counter(attr(href), page);
}

ul.toc li {
	line-height: 2;
}

ul.toc li a {
	text-decoration: none;
}

a {
	color: #000;
}

/* add page number to cross references */
a.xref:after {
  content: " (page " target-counter(attr(href, url), page) ")";
}
`;
            let newContent = "<html><head><meta charset='utf-8'/><title></title>" +
                "<style>" + css + "</style>" +
                "</head><body>" +
                this.previewHTML + "</body></html>";
            let newWin = window.open();
            newWin.focus();
            newWin.document.write(newContent);
            newWin.print();
            newWin.document.close();
            newWin.close();
        }
    }
})
;