/*!
 * GalleryJs v1.0.0
 * Copyright 2025 WebUtilsHub
 * Website: https://www.webutilshub.com/
 * Author: Hq
 */

var jQuery_loaded = false;
var YouTube_ready = false;
var galleryJs_isMobile = false;
var galleryJs_active = false;
var galleryJs_video = null;
var galleryJs_yt_players = [];
var galleryJs_hasYouTube = false;

window.onload = function() {
    if( window.jQuery ) {
        galleryJs_isMobile = $(window).width() < 768 ? true : false;
        jQuery_loaded = true;

        // GALLERY POPUP
        $(document).ready(function() {
            // Main Function
            $('body').on('click', 'a[data-galleryjs]', function(e) {
                e.preventDefault();

                const regex = /\.(mp4|mov)$/;
                const youtube = /https?:\/\/(www\.)?(youtube\.com\/|youtu\.be\/)/g;

                let YouTube_loaded = false;

                let gallery_html = '';
                let gallery_id = $(this).data('galleryjs');
                let gallery_list = $('a[data-galleryjs="' + gallery_id + '"]');
                let goto = 0;

                let gallery_bg = '<div class="galleryJs galleryJs-bg">\n';
                gallery_bg += '<a href="javascript:void(0);" class="btn-galleryJs-close"></a>\n';
                gallery_bg += '<a href="javascript:void(0);" class="btn-galleryJs-prev"></a>\n';
                gallery_bg += '<a href="javascript:void(0);" class="btn-galleryJs-next"></a>\n';

                let gallery_wrapper = '<div class="galleryJs-wrapper">\n<div class="galleryJs-items">\n';

                let i = 0;
                let num = 0;
                let total = gallery_list.length;
                $.each( gallery_list, function() {
                    if( $(this).get(0) === e.currentTarget ) {
                        goto = i;
                    }

                    // Added split function to deal with resources with ? parameters
                    let source = $(this).prop('href').split('?')[0];
                    let caption = $(this).prop('title').replace('|', '<br />');
                    num++;

                    gallery_wrapper += '<div class="galleryJs-item">\n';
                    if( source.match( regex ) ) {
                        gallery_wrapper += '<video id="galleryJs-video-' + i + '" class="galleryJs-video" width="100%" height="100%" controls>\n';
                        gallery_wrapper += '<source src="' + source + '" type="video/mp4">';
                        gallery_wrapper += 'Your browser does not support the video tag.';
                        gallery_wrapper += '</video>\n';
                    } else if( source.match( youtube ) ) {
                        galleryJs_hasYouTube = true;
                        if( !YouTube_loaded ) {
                            var tag = document.createElement('script');
                            tag.src = "https://www.youtube.com/iframe_api";
                            var firstScriptTag = document.getElementsByTagName('script')[0];
                            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                            YouTube_loaded = true;
                        }
                        source = $(this).prop('href');
                        if( source.includes( '?' ) ) {
                            source += '&enablejsapi=1&rel=0&origin=' + window.location.origin;
                        } else {
                            source += '?enablejsapi=1&rel=0&origin=' + window.location.origin;
                        }
                        gallery_wrapper += '<iframe width="800" height="480" src="' + source + '" class="galleryJs-youtube" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
                    } else {
                        gallery_wrapper += '<div class="galleryJs-image" style="background-image: url(\'' + source + '\');">\n';
                        gallery_wrapper += '<img src="' + source + '">\n';
                        gallery_wrapper += '</div>\n';
                    }
                    if( caption ) {
                        gallery_wrapper += '<span class="galleryJs-caption">' + caption + '</span>\n';
                    }

                    gallery_wrapper += '</div>\n';

                    i++;
                });

                gallery_wrapper += '</div>\n';
                gallery_wrapper += '</div>\n';
                gallery_wrapper += '<div class="galleryJs-pagination"><span></span> / ' + total + '</div>\n';

                gallery_html = gallery_bg + gallery_wrapper + '</div>\n';

                // Clear existing popup if exists
                $('.galleryJs').remove();

                $('body').append( gallery_html );

                if( galleryJs_hasYouTube ) {
                    if( YouTube_loaded ) {
                        let waitYouTube = setInterval( function() {
                            if( YouTube_ready ) {
                                galleryJs_yt_players = [];
                                initYouTubeIframe();

                                setTimeout(function() {
                                    $('.galleryJs').addClass('active');
                                    galleryJs_active = true;
                
                                    galleryJs_goto( goto );
                                }, 50);

                                clearInterval( waitYouTube );
                            }
                        }, 500 );
                    }
                } else {
                    setTimeout(function() {
                        $('.galleryJs').addClass('active');
                        galleryJs_active = true;
    
                        galleryJs_goto( goto );
                    }, 50);
                }
            });

            // Close Button
            $('body').on('click', '.galleryJs .btn-galleryJs-close', function(e) {
                e.preventDefault();

                $('.galleryJs-bg').remove();
                galleryJs_active = false;
            });

            // Prev/Next Buttons
            $('body').on('click', '.galleryJs .btn-galleryJs-prev, .galleryJs .btn-galleryJs-next', function(e) {
                e.preventDefault();

                let direction   = $(this).hasClass('btn-galleryJs-prev') ? -1 : 1;
                let galleryJs   = $('.galleryJs');
                let current     = galleryJs.data('current') || 0;
                let next        = current + direction;

                galleryJs_goto( next );
            });

            let touchStartX = 0;
            let touchStartY = 0;
            let touchEndX = 0;
            let touchEndY = 0;

            const minSwipeDistance = 30; // Adjust this for sensitivity

            $('body').on('touchstart', '.galleryJs .galleryJs-item', function(e) {
                const touch = e.originalEvent.touches[0];
                touchStartX = touch.pageX;
                touchStartY = touch.pageY;
            });

            $('body').on('touchend', '.galleryJs .galleryJs-item', function(e) {
                const touch = e.originalEvent.changedTouches[0];
                touchEndX = touch.pageX;
                touchEndY = touch.pageY;

                handleSwipe();
            });

            let zoomed = false;
            $('body').on('click', '.galleryJs .galleryJs-image', function(e) {
                e.preventDefault();

                // $(this).parent().toggleClass('zoomed');
                const $this = $(this);
                const $container = $this.parent();
                const offset = $this.offset();
                const width = $this.width();
                const height = $this.height();

                const clickX = e.pageX - offset.left;
                const clickY = e.pageY - offset.top;

                if (!zoomed) {
                    $this.parent().addClass('zoomed');
                    $this.parent().get(0).scrollLeft = clickX;
                    $this.parent().get(0).scrollTop = clickY;
                    zoomed = true;
                } else {
                    $this.parent().removeClass('zoomed');
                    zoomed = false;
                }
            });

            function handleSwipe() {
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;

                let direction   = 1;
                let galleryJs   = $('.galleryJs');
                let current     = galleryJs.data('current') || 0;
                
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe
                    if (Math.abs(deltaX) > minSwipeDistance) {
                        if (deltaX > 0) {
                            direction = -1;
                        } else {
                            direction = 1;
                        }
                    }
                } else {
                    // Vertical swipe
                    if (Math.abs(deltaY) > minSwipeDistance) {
                        if (deltaY > 0) {
                            // console.log('Swipe Down');
                        } else {
                            // console.log('Swipe Up');
                        }
                    }
                }

                let next = current + direction;
                galleryJs_goto( next );
            }

            // Keyboard Navigation
            $(document).keydown(function(e) {
                if( galleryJs_active ) {
                    if( typeof e.key !== 'undefined' ) {
                        if( e.key === 'ArrowLeft' ) {
                            // Left arrow key
                            $(".galleryJs .btn-galleryJs-prev").trigger('click');
                            e.preventDefault();
                        } else if( e.key === 'ArrowRight' ) {
                            // Right arrow key
                            $(".galleryJs .btn-galleryJs-next").trigger('click');
                            e.preventDefault();
                        } else if( e.key == 'Escape' ) {
                            // Escape key
                            $(".galleryJs .btn-galleryJs-close").trigger('click');
                            e.preventDefault();
                        }
                    } else {
                        if( e.keyCode == 37 ) {
                            // Left arrow key
                            $(".galleryJs .btn-galleryJs-prev").trigger('click');
                            e.preventDefault();
                        } else if( e.keyCode == 39 ) {
                            // Right arrow key
                            $(".galleryJs .btn-galleryJs-next").trigger('click');
                            e.preventDefault();
                        } else if( e.keyCode == 27 ) {
                            // Escape key
                            $(".galleryJs .btn-galleryJs-close").trigger('click');
                            e.preventDefault();
                        }
                    }
                }
            });
        });

        // GoTo Function
        function galleryJs_goto( goto ) {
            let galleryJs   = $('.galleryJs');
            let num         = galleryJs.find('.galleryJs-item').length;
            
            if( goto < 0 || goto >= num ) {
                return;
            }

            if( typeof galleryJs_video !== 'undefined' && galleryJs_video !== null ) {
                galleryJs_video.pause();
                galleryJs_video.currentTime = 0;
            }
            
            galleryJs.find('.galleryJs-items .galleryJs-item').removeClass('current');
            galleryJs.data('current', goto).find('.galleryJs-items .galleryJs-item:nth-child(' + ( goto + 1 ) + ')').addClass('current');
            galleryJs.find('.galleryJs-pagination span').html( galleryJs.data('current') + 1 );

            if( goto === 0 ) {
                galleryJs.find('.btn-galleryJs-prev').addClass('btn-galleryJs-disabled');
            } else {
                galleryJs.find('.btn-galleryJs-prev').removeClass('btn-galleryJs-disabled');
            }
            if( goto === ( num - 1 ) ) {
                galleryJs.find('.btn-galleryJs-next').addClass('btn-galleryJs-disabled');
            } else {
                galleryJs.find('.btn-galleryJs-next').removeClass('btn-galleryJs-disabled');
            }

            // Video auto playback (only on desktop)
            let galleryItem = galleryJs.find('.galleryJs-item:nth-child(' + ( goto + 1 ) + ')').children();
            if( !galleryJs_isMobile && galleryItem.hasClass('galleryJs-video') ) {
                galleryJs_video = galleryItem.get(0);
                galleryJs_video.play();
            }

            $.each( galleryJs_yt_players, function( k, v ) {
                this.pauseVideo();
            });
        }

        // YouTube Functions
        function initYouTubeIframe() {
            $('.galleryJs-item .galleryJs-youtube').each( function (k, v) {
                if (!this.id) {
                    this.id='embeddedvideoiframe' + k;
                }
                galleryJs_yt_players.push(new YT.Player(this.id))
            });
        }
    } else {
        // jQuery is not loaded
        console.log('GalleryJs requires jQuery to function.');
    }
}

// YouTube Functions
if (typeof onYouTubeIframeAPIReady === "function") {
    // Save a reference to the original function
    const ori_onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

    // Overwrite the function
    onYouTubeIframeAPIReady = function() {
        YouTube_ready = true;

        // Call the original function
        ori_onYouTubeIframeAPIReady.apply(this, arguments);
    };
} else {
    function onYouTubeIframeAPIReady() {
        YouTube_ready = true;
    }
}