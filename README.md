## 使用前先引入pdf.js，然后将pdf.worker.js放在服务器下
## 渲染PDF

## $("#bookPDF").PdfRender({
##      initialWidth : $("#bookPDF").width()-100,//初始填充宽度，可不填（以1的比例渲染）
##      url : "{{$url}}",
##      workerSrc : url,//pdf.worker.js的url
##      onloadFun : function(){}//渲染后的回调
## })