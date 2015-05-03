/*globals jQuery, google, document */
(function ($) {
    "use strict";
    var pluginName = "asosZoom",
        defaults = {
            zoom: 'vertical',
            speed: 500,
            thumbnails: true,
            closeButtonTemplate: '<a href="#" id="asosZoom__content__close">{{closeText}}</a>',
            closeText: 'x',
            controls: true,
            arrowsTemplate: '<a href="#" id="asosZoom__content__next">{{nextText}}</a><a href="#" id="asosZoom__content__prev">{{prevText}}</a>',
            thumbnailPosition: 'vertical',
            onDisplayed: function () {},
            onClose: function () {},
            overlayColor: '#000000',
            overlayOpacity: '0.7',
            imageResize: null,
            containerWidth: '70%',
            containerHeight: '90%',
            nextText: '&gt;',
            prevText: '&lt;',
            nav: true
        };
    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(this.element);
        this.$thumbs = null;
        this.$galleryLinks = null;
        this.$body = $('body');
        this.$zoomedImage = null;
        this.options = options;
        this.metadata = this.$element.data('options');
        this.settings = $.extend({}, defaults, this.options, this.metadata);
        this.currentIndex = 0;
        this.init();
    }
    Plugin.prototype = {
        init: function () {
            var that = this;
            this.bindEvents();
        },
        bindEvents: function () {
            var that = this;
            that.$element.on('click', function (e) {
                e.preventDefault();
                that.removeZoom(true);// remove previous instance
                that.appendZoomHtml($(this).attr('href'), $(this).attr('rel'));// append zoom
                that.showZoom();
                that.enableZoomActions();
                that.closingActions();
                that.updateCurrentThumb();
                that.settings.onDisplayed.call(that);
            });
        },
        showZoom: function () {
            $('#asosZoom__overlay')
                .css('background', this.settings.overlayColor)
                .fadeTo(0, this.settings.overlayOpacity);
            $('#asosZoom').fadeIn(this.settings.speed);
        },
        removeZoom: function (cleanUp) {
            $('#asosZoom').remove();
            if (!cleanUp) {
                this.settings.onClose.call(this);
            }
        },
        closingActions: function () {
            var that = this;
            $(document).off('click.asosZoom').on('click.asosZoom', '#asosZoom', function (e) {
                e.preventDefault();
                that.removeZoom();
            }).off('keydown.asosZoom').on('keydown.asosZoom', function (e) {
                if (e.keyCode === 27) {
                   that.removeZoom();
                }
            });
        },
        enableZoomActions: function () {
            var that = this;
            that.$zoomedImage.on('mousemove', function (e) {
                var fullWidth = that.$zoomedImage.width(),
                    fullHeight = that.$zoomedImage.height(),
                    contentWidth = $('#asosZoom__content').width(),
                    contentHeight = $('#asosZoom__content').height(),
                    offset = $('#asosZoom__content').offset(),
                    mouseX = e.pageX - offset.left,
                    mouseY = e.pageY - offset.top,
                    posX = (Math.round((mouseX / contentWidth) * 100) / 100) * (fullWidth - contentWidth),
                    posY = (Math.round((mouseY / contentHeight) * 100) / 100) * (fullHeight - contentHeight);
                if (that.settings.zoom === 'vertical') {
                    that.$zoomedImage.css('top', '-' + posY + 'px');
                } else if (that.settings.zoom === 'horizontal') {
                    that.$zoomedImage.css('left', '-' + posX + 'px');
                } else {
                    that.$zoomedImage.css({
                        top: '-' + posY + 'px',
                        right: posX + 'px'
                    });
                }
            });
        },
        appendZoomHtml: function (fullImageUrl, imageRel) {
            var zoomHtml,
                zoomContainer,
                imageContainer,
                thumbContainer,
                zoomedImage;
            if (this.settings.imageResize === 'height') {
                zoomContainer = '<div id="asosZoom__content">';
            } else {
                zoomContainer = '<div id="asosZoom__content" style="max-width:' + this.settings.containerWidth + '; height:' + this.settings.containerHeight + '">';
            }
            zoomedImage = '<img id="asosZoom__content__img__xl" src="' + fullImageUrl + '" />';
            if (this.settings.thumbnails) {
                if (this.settings.thumbnailPosition === "vertical") {
                    thumbContainer = "zThumbsVertical";
                } else {
                    thumbContainer = "zThumbsHorizontal";
                }
                imageContainer = 'asosZoom__content__img';
                zoomHtml = '<div id="asosZoom"><div id="asosZoom__overlay"></div>' + zoomContainer + '<div id="' + imageContainer + '"></div><div id="asosZoom__content__thumbs" class="' + thumbContainer + '"></div></div></div>';
            } else {
                imageContainer = 'asosZoom__content';
                zoomHtml = '<div id="asosZoom"><div id="asosZoom__overlay"></div>' + zoomContainer + '</div></div>';
            }
            this.$body.append(zoomHtml);
            $('#' + imageContainer).append(zoomedImage);
            if (imageRel && this.settings.nav) {
                this.appendThumbnails(imageRel);
            }
            $('#asosZoom__content').append(this.settings.closeButtonTemplate.replace('{{closeText}}', this.settings.closeText));
            this.$zoomedImage = $('#asosZoom__content__img__xl');
        },
        appendThumbnails: function (imageRel) {
            var that = this;
            that.$galleryLinks = $('a[rel="' + imageRel + '"]');
            if (that.$galleryLinks.length > 1) {
                that.appendArrows();
                that.$galleryLinks.each(function (index) {
                    if (this === that.element) {
                        that.currentIndex = index;
                    }
                    $('#asosZoom__content__thumbs').append('<a href="' + this.href + '" class="asosZoom-thumb"><img src="' + this.href + '" alt=""/></a>');
                });
                that.$thumbs = $('#asosZoom__content__thumbs a');
                that.$thumbs.on('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var $this = $(this);
                    $this.siblings().removeClass('active');
                    $this.addClass('active');
                    that.currentIndex = that.$thumbs.index($this);
                    that.$zoomedImage.attr('src', $this.attr('href'));
                });
                if (that.settings.controls) {
                    that.arrows();
                }
            }
        },
        arrows: function () {
            var that = this;
            $('#asosZoom__content__next').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                that.showNext();
            });
            $('#asosZoom__content__prev').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                that.showPrev();
            });
            $(document).off('keydown.arrows').on('keydown.arrows', function (e){
                if (e.keyCode === 37) {
                    that.showPrev();
                } else if (e.keyCode === 39) {
                    that.showNext();
                }
            });
        },
        appendArrows: function () {
            $('#asosZoom__content').append(this.settings.arrowsTemplate.replace('{{nextText}}', this.settings.nextText).replace('{{prevText}}', this.settings.prevText));
        },
        showNext: function () {
            if (this.currentIndex + 1 >= this.$thumbs.length) {
                this.currentIndex = 0;
            } else {
                this.currentIndex += 1;
            }
            this.$zoomedImage.attr('src', this.$thumbs[this.currentIndex].href);
            this.updateCurrentThumb();
        },
        showPrev: function () {
            if (this.currentIndex <= 0) {
                this.currentIndex = this.$thumbs.length - 1;
            } else {
                this.currentIndex -= 1;
            }
            this.$zoomedImage.attr('src', this.$thumbs[this.currentIndex].href);
            this.updateCurrentThumb();
        },
        updateCurrentThumb: function () {
            if (this.$thumbs) {
                this.$thumbs.removeClass('active');
                this.$thumbs.eq(this.currentIndex).addClass('active');
            }
        }
    };
    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin(this, options));
            }
        });
    };
}(jQuery));