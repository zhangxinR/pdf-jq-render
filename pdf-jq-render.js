function PDFrender($parentDom,options){
    this.$parentDom = $parentDom;
    this.pdfjsLib = window['pdfjs-dist/build/pdf'];
    this.pdfDoc = null;
    this.pageRendering = false; 
    this.pageNumPending = null;
    this.canvas = null;
    this.ctx = null;
    this.options = $.extend({},PDFrender.Default,options);
    this.initialScale = 1;
    this.scale = null;
    this.scalePercent = [50,75,100,200,300]
    this._init();
    this._bindEvent();
    this._firstRender();
}
PDFrender.Default = {
    url : null,//必传
    pageNum : 1, 
    initialWidth : null, 
    onloadFun : null, //页面加载完后的处理函数
    workerSrc : null //必传
}
//初始化
PDFrender.prototype._init = function(){
    var me = this,
        temps = me._template;
    var $btnP = $(temps._btnParent);
    $btnP.append(temps._preBtn);
    $btnP.append(temps._nextBtn);
    $btnP.append("页码");
    $btnP.append(temps._pageNum);
    $btnP.append(" / ");
    $btnP.append($(temps._pageCount));
    var $scale = $(temps._scalePercent);
    $.each(me.scalePercent,function(index,item){
        var $scaleOption = $(temps._scaleOption);
        $scaleOption.val(item).html(item+"%");
        if(item == 100){
            $scaleOption.attr("selected","selected");
        }
        $scale.append($scaleOption);
    })
    $btnP.append(temps._scaleInfo);
    $btnP.append($scale);
    var $canvasParent = $(temps._canvasParent);
    var $canvasP = $(temps._canvasPage);
    var $canvas = $(temps._canvas);
    me.canvas = $canvas[0];
    me.ctx = me.canvas.getContext('2d');
    $canvasP.append($canvas);
    $canvasParent.append($canvasP);
    me.$parentDom.append($canvasParent);
    me.$parentDom.append($btnP);
}
PDFrender.prototype._bindEvent = function(){
    var me = this;
    var opts = me.options;
    //上一页
    me.$parentDom.on("click","#prev",function(){
        if (opts.pageNum <= 1) { 
            return; 
        } 
        opts.pageNum--; 
        me._queueRenderPage(opts.pageNum); 
    })
    //下一页
    me.$parentDom.on("click","#next",function(){
        if (opts.pageNum >= me.pdfDoc.numPages) { 
            return; 
        } 
        opts.pageNum++; 
        me._queueRenderPage(opts.pageNum); 
    })
    //输入框
    me.$parentDom.on("change","#pageNum",function(){
        opts.pageNum = Number($(this).val());
        if(opts.pageNum > me.pdfDoc.numPages){
            alert("页码超出总数！")
            opts.pageNum = 1;
        };
        if(opts.pageNum < 1){
            alert("页码不能小于1！")
            opts.pageNum = 1;
        };
        me._queueRenderPage(opts.pageNum); 
    })
    me.$parentDom.on("input","#pageNum",function(){
        if(this.value.length == 1) {
            this.value = this.value.replace(/[^1-9]/g, '')
        } else {
            this.value = this.value.replace(/\D/g, '')
        }
    })
    //缩放
    me.$parentDom.on("change","#scaleSelect",function(){
        var val = $(this).val();
        me._scale(val);
    })
}
PDFrender.prototype._template = {
    _btnParent:'<div class="page-turn text-center"></div>',
    _preBtn:'<button class="btn" id="prev">上一页</button>',
    _nextBtn:'<button class="btn" id="next">下一页</button>',
    _pageNum:'<input class="form-control page-num" id="pageNum" type="text">',
    _pageCount:'<span id="pageCount"></span>',
    _scaleInfo : '<span class="scale-info">缩放比例</span>',
    _scalePercent:'<select class="form-control scale-select" id="scaleSelect"></select>',
    _scaleOption:'<option></option>',
    _canvasParent:'<div class="pdf-parent"></div>',
    _canvasPage:'<div id="pdfPage" class="pdf-page"></div>',
    _canvas:'<canvas id="theCanvas"></canvas>'
}
//渲染
PDFrender.prototype._renderPage = function(num){
    var me = this;
    var opts = me.options;
    me.pageRendering = true; 
    me.pdfDoc.getPage(num).then(function(page) {
        if(me.scale == null){
            if(opts.initialWidth != null){
                me.initialScale = opts.initialWidth/page.view[2];
            }
            me.scale = me.initialScale;
        }
        var viewport = page.getViewport(me.scale); 
        me.canvas.height = viewport.height; 
        me.canvas.width = viewport.width; 
        
        var renderContext = { 
            canvasContext: me.ctx, 
            viewport: viewport 
        }; 
        var renderTask = page.render(renderContext); 
        
        renderTask.promise.then(function() {
            me.pageRendering = false;
            if (me.pageNumPending !== null) { 
                // New page rendering is pending 
                me._renderPage(me.pageNumPending); 
                me.pageNumPending = null; 
            } 
        });
        if(opts.onloadFun){
            opts.onloadFun(opts.pageNum);
        };
    }); 
    document.getElementById('pageNum').value = opts.pageNum; 
}
//pageNumPending做开关，防止重叠
PDFrender.prototype._queueRenderPage = function(num){
    var me = this;
    if (me.pageRendering) { 
        me.pageNumPending = num; 
    } else { 
        me._renderPage(num); 
    }
}
//缩放功能
PDFrender.prototype._scale = function(scale){
    var me = this;
    var opts = me.options;
    me.scale = Number(me.initialScale)*(scale/100);
    this._queueRenderPage(opts.pageNum);
}
//初次加载PDF
PDFrender.prototype._firstRender = function(){
    var me = this;
    var opts = me.options;
    me.pdfjsLib.GlobalWorkerOptions.workerSrc = opts.workerSrc;
    me.pdfjsLib.getDocument(opts.url).then(function(pdfDoc_) { 
        me.pdfDoc = pdfDoc_; 
        document.getElementById('pageCount').textContent = me.pdfDoc.numPages; 
            
        me._renderPage(opts.pageNum); 
    });
}
$.fn.PdfRender = function (options){
    this.each(function(){
        var me = $(this);
        new PDFrender(me,options);
    })
    return this;
}