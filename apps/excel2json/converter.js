//
//  converter.js
//  Mr-Data-Converter
//
//  Created by Shan Carter on 2010-09-01.
//



function DataConverter(nodeId) {

  //---------------------------------------
  // PUBLIC PROPERTIES
  //---------------------------------------

  this.nodeId                 = nodeId;
  this.node                   = $("#"+nodeId);

  this.outputDataTypes        = [
                                {"text":"Actionscript",           "id":"as",               "notes":""},
                                {"text":"ASP/VBScript",           "id":"asp",              "notes":""},
                                {"text":"HTML",                   "id":"html",             "notes":""},
                                {"text":"JSON - Properties",      "id":"json",             "notes":""},
                                {"text":"JSON - Column Arrays",   "id":"jsonArrayCols",    "notes":""},
                                {"text":"JSON - Row Arrays",      "id":"jsonArrayRows",    "notes":""},
                                {"text":"JSON - Dictionary",      "id":"jsonDict",         "notes":""},
                                {"text":"MySQL",                  "id":"mysql",            "notes":""},
                                {"text":"PHP",                    "id":"php",              "notes":""},
                                {"text":"Python - Dict",          "id":"python",           "notes":""},
                                {"text":"Ruby",                   "id":"ruby",             "notes":""},
                                {"text":"XML - Properties",       "id":"xmlProperties",    "notes":""},
                                {"text":"XML - Nodes",            "id":"xml",              "notes":""},
                                {"text":"XML - Illustrator",      "id":"xmlIllustrator",   "notes":""}];
  this.outputDataType         = "json";

  this.columnDelimiter        = "\t";
  this.rowDelimiter           = "\n";

  this.inputTextArea          = {};
  this.outputTextArea         = {};

  this.inputHeader            = {};
  this.outputHeader           = {};
  this.dataSelect             = {};

  this.inputText              = "";
  this.outputText             = "";

  this.newLine                = "\n";
  this.indent                 = "  ";

  this.root                   = "rows";
  this.child                  = "row";

  this.commentLine            = "//";
  this.commentLineEnd         = "";
  this.tableName              = "MrDataConverter"

  this.useUnderscores         = true;
  this.headersProvided        = true;
  this.downcaseHeaders        = true;
  this.upcaseHeaders          = false;
  this.includeWhiteSpace      = true;
  this.useTabsForIndent       = false;

}

//---------------------------------------
// PUBLIC METHODS
//---------------------------------------

DataConverter.prototype.create = function(w,h) {
  var self = this;

  //build HTML for converter
  this.inputHeader = $('<div class="groupHeader" id="inputHeader"><p class="groupHeadline">数据源输入<span class="subhead">（可以直接从Excel/CVS中拷贝内容到这里！ <a href="#" id="insertSample">简单示例！</a>）</span></p></div>');
  this.inputTextArea = $('<textarea class="textInputs" id="dataInput" placeholder="输入CVS或者以tab为间隔的数据"></textarea>');
  var outputHeaderText = '<div class="groupHeader" id="outputHeader"><p class="groupHeadline">结果转换为<select name="Data Types" id="dataSelector" class="form-control">';
    for (var i=0; i < this.outputDataTypes.length; i++) {

      outputHeaderText += '<option value="'+this.outputDataTypes[i]["id"]+'" '
              + (this.outputDataTypes[i]["id"] == this.outputDataType ? 'selected="selected"' : '')
              + '>'
              + this.outputDataTypes[i]["text"]+'</option>';
    };
    outputHeaderText += '</select><span class="subhead" id="outputNotes"></span></p></div>';
  this.outputHeader = $(outputHeaderText);
  this.outputTextArea = $('<textarea class="textInputs" id="dataOutput" placeholder="转换后的结果会显示在这里"></textarea>');

  this.node.append(this.inputHeader);
  this.node.append(this.inputTextArea);
  this.node.append(this.outputHeader);
  this.node.append(this.outputTextArea);

  this.dataSelect = this.outputHeader.find("#dataSelector");


  //add event listeners

  // $("#convertButton").bind('click',function(evt){
  //   evt.preventDefault();
  //   self.convert();
  // });

  this.outputTextArea.click(function(evt){this.select();});


  $("#insertSample").bind('click',function(evt){
    evt.preventDefault();
    self.insertSampleData();
    self.convert();
    _gaq.push(['_trackEvent', 'SampleData','InsertGeneric']);
  });

  $("#dataInput").keyup(function() {self.convert()});
  $("#dataInput").change(function() {
    self.convert();
    _gaq.push(['_trackEvent', 'DataType',self.outputDataType]);
  });

  $("#dataSelector").bind('change',function(evt){
       self.outputDataType = $(this).val();
       self.convert();
     });

  this.resize(w,h);
}

DataConverter.prototype.resize = function(w,h) {

  var paneWidth = w;
  var paneHeight = (h-90)/2-20;

  this.node.css({width:paneWidth});
  this.inputTextArea.css({width:paneWidth-20,height:paneHeight});
  this.outputTextArea.css({width: paneWidth-20, height:paneHeight});

}

DataConverter.prototype.convert = function() {

  this.inputText = this.inputTextArea.val();
  this.outputText = "";


  //make sure there is input data before converting...
  if (this.inputText.length > 0) {

    if (this.includeWhiteSpace) {
      this.newLine = "\n";
    } else {
      this.indent = "";
      this.newLine = "";
    }

    CSVParser.resetLog();
    var parseOutput = CSVParser.parse(this.inputText, this.headersProvided, this.delimiter, this.downcaseHeaders, this.upcaseHeaders);

    var dataGrid = parseOutput.dataGrid;
    var headerNames = parseOutput.headerNames;
    var headerTypes = parseOutput.headerTypes;
    var errors = parseOutput.errors;

    this.outputText = DataGridRenderer[this.outputDataType](dataGrid, headerNames, headerTypes, this.indent, this.newLine);


    //验证成功，将会对其中的节点进行替换
    //否者，直接对数据进行输出
    if(this.root
        && this.child
        && (this.outputDataType === "xmlProperties"
            || this.outputDataType === "xml")){

      //替换其中的根节点与字节点
      this.outputText = this.outputText.replace(/rows/g,this.root)
      this.outputText = this.outputText.replace(/row/g,this.child);
    }
    this.outputTextArea.val(errors + this.outputText);



  }; //end test for existence of input text
}


DataConverter.prototype.insertSampleData = function() {
  this.inputTextArea.val("NAME\tVALUE\tCOLOR\tDATE\nAlan\t12\tblue\tSep. 25, 2009\nShan\t13\t\"green\tblue\"\tSep. 27, 2009\nJohn\t45\torange\tSep. 29, 2009\nMinna\t27\tteal\tSep. 30, 2009");
}


