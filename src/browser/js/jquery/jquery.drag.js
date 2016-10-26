// jQuery drag event handler
// note: triggerHandler() is used instead of trigger() when event bubblig is not
// necessary, this increases performances a lot.
;(function($){
    var events = {
            touch:{start:'touchstart',stop:'touchend touchcancel',move:'touchmove',touch:true},
            mouse:{start:'mousedown',stop:'mouseup',move:'mousemove',out:'mouseout',touch:false}
        },


        $document = $(document),
        getOffset = function(obj) {
            var offsetLeft = 0
            var offsetTop = 0
            if (obj) {
                do {
                    if (!isNaN(obj.offsetLeft)) {
                        offsetLeft += obj.offsetLeft - obj.scrollLeft
                    }
                    if (!isNaN(obj.offsetTop)) {
                        offsetTop += obj.offsetTop - obj.scrollTop
                    }
                } while(obj = obj.offsetParent )
            }

            return {left: offsetLeft, top: offsetTop}
        }


    $.event.special.draginit = $.event.special.drag = {
        setup:function(){

            var $this = $(this)

            if ($this.data('dragSetup')) return
            $this.data('dragSetup','true')


            // mouse single touch handler
            var previousEvent = null,
                target = null,
                traversing = false,
                mouseStartHandler = function(e){

                    // ignore mouse event when fired by a simulated touch event
                    if ((e.originalEvent.sourceCapabilities && e.originalEvent.sourceCapabilities.firesTouchEvents) || e.button == 2) return

                    isPointerDown = true
                    target = $this
                    previousEvent = e

                    e.speedX = 0
                    e.speedY = 0
                    e.deltaX = 0
                    e.deltaY = 0

                    target.triggerHandler('draginit',[e,e.originalEvent.traversing])

                    $document.on(events.mouse.move,mouseMoveHandler)
                    $document.on(events.mouse.stop,mouseStopHandler)
                    $document.on(events.mouse.out,mouseOutHandler)

                },
                mouseMoveHandler = function(e){
                    e.stopPropagation()

                    e.speedX = e.pageX - previousEvent.pageX
                    e.speedY = e.pageY - previousEvent.pageY
                    e.deltaX = e.speedX + previousEvent.deltaX
                    e.deltaY = e.speedY + previousEvent.deltaY


                    if (e.originalEvent.traversing) {
                        target = $(e.target)
                        e.preventDefault()
                        target.triggerHandler('draginit',[e,e.originalEvent.traversing])
                    } else {
                        target.triggerHandler('drag',[e,e.originalEvent.traversing])
                    }

                    previousEvent = e
                },
                mouseStopHandler = function(e){
                    e.stopPropagation()

                    // ignore mouse event when fired by a simulated touch event
                    if (e.originalEvent.sourceCapabilities && e.originalEvent.sourceCapabilities.firesTouchEvents) return

                    e.speedX = e.pageX - previousEvent.pageX
                    e.speedY = e.pageY - previousEvent.pageY
                    e.deltaX = e.deltaX + previousEvent.deltaX
                    e.deltaY = e.deltaY + previousEvent.deltaY


                    target.trigger('dragend',[e,e.originalEvent.traversing])
                    isPointerDown = false
                    $document.off(events.mouse.move,mouseMoveHandler)
                    $document.off(events.mouse.stop,mouseStopHandler)
                    $document.off(events.mouse.out,mouseOutHandler)
                },
                mouseOutHandler = function(e){
                    if (e.originalEvent.traversing) {
                        e.stopPropagation()

                        e.speedX = e.pageX - previousEvent.pageX
                        e.speedY = e.pageY - previousEvent.pageY
                        e.deltaX = e.deltaX + previousEvent.deltaX
                        e.deltaY = e.deltaY + previousEvent.deltaY

                        target.trigger('dragend',[e,e.originalEvent.traversing])

                        previousEvent = e

                    }
                }


            $this.on(events.mouse.start,mouseStartHandler)


            // multi touch hanlder
            window.targets = window.targets || {}
            window.previousTouches = window.previousTouches || {}
            window.touchActive = window.touchActive || false

            var self = this,
                touchStartHandler = function(e){
                    e.preventDefault()

                    var oE = e.originalEvent

                    for (i in oE.changedTouches) {
                        if (isNaN(i)) continue

                        var touch = oE.changedTouches[i],
                            id = touch.identifier

                        targets[id] = $(touch.target)
                        previousTouches[id] = touch

                        touch.speedX = 0
                        touch.speedY = 0

                        touch.deltaX = 0
                        touch.deltaY = 0

                        var off = getOffset(touch.target)
                        touch.offsetX = touch.pageX-off.left
                        touch.offsetY = touch.pageY-off.top

                        targets[id].triggerHandler('draginit',[touch,e.originalEvent.traversing])

                    }

                    if (!touchActive) {
                        $document.on(events.touch.move,touchMoveHandler)
                        $document.on(events.touch.stop,touchStopHandler)
                        touchActive = true
                    }

                },
                touchMoveHandler = function(e){

                    var oE = e.originalEvent

                    for (i in oE.changedTouches) {
                        if (isNaN(i)) continue


                        var touch = oE.changedTouches[i],
                            id = touch.identifier

                        if (e.originalEvent.traversing) {
                            targets[id] = $(document.elementFromPoint(touch.clientX, touch.clientY))
                        }

                        // touched[targets[id]] = touched[targets[id]]?touched[targets[id]]+1:1

                        touch.speedX = touch.pageX - previousTouches[id].pageX
                        touch.speedY = touch.pageY - previousTouches[id].pageY

                        touch.deltaX = touch.speedX + previousTouches[id].deltaX
                        touch.deltaY = touch.speedY + previousTouches[id].deltaY

                        touch.offsetX = previousTouches[id].offsetX+touch.speedX
                        touch.offsetY = previousTouches[id].offsetY+touch.speedY

                        if (e.originalEvent.traversing) {
                            touch.traversing = true
                            var previousTarget = document.elementFromPoint(previousTouches[id].clientX, previousTouches[id].clientY)
                            if (targets[id][0]!=previousTarget) {
                                var off = getOffset(targets[id][0])
                                touch.offsetX = touch.pageX-off.left
                                touch.offsetY = touch.pageY-off.top
                                $(previousTarget).trigger('dragend',[touch,e.originalEvent.traversing])
                            }
                            e.preventDefault()
                            if (oE.traversingContainer.contains(targets[id][0])) targets[id].triggerHandler('draginit',[touch,e.originalEvent.traversing])

                        } else {

                            targets[id].triggerHandler('drag',[touch,e.originalEvent.traversing])

                        }

                        previousTouches[id] = touch

                    }

                },
                touchStopHandler = function(e){

                    var oE = e.originalEvent

                    for (i in oE.changedTouches) {

                        if (isNaN(i)) continue

                        var touch = oE.changedTouches[i],
                            id = touch.identifier

                        $(oE.changedTouches[i].target).trigger('dragend',[touch,e.originalEvent.traversing])

                        delete previousTouches[id]
                        delete targets[id]

                    }

                    if (oE.touches.length==0) {
                        $document.off(events.touch.move,touchMoveHandler)
                        $document.off(events.touch.stop,touchStopHandler)
                        touchActive = false
                    }

                }

            $this.on(events.touch.start,touchStartHandler)


        }

    }








    var makeEventTraversing = function(e){
            e.traversing=true
            if (!e.traversingContainer) e.traversingContainer=this
        }


    $.fn.enableTraversingGestures = function() {

        var self = this[0]

        var down = function(e){
                makeEventTraversing(e)
                self.addEventListener("mousemove", makeEventTraversing, true)
                self.addEventListener("touchmove", makeEventTraversing, true)
                self.addEventListener("mouseout", makeEventTraversing, true)
                document.addEventListener("mouseup",up,true)
                document.addEventListener("touchend",up,true)
            },
            up = function(){
                self.removeEventListener("mousemove", makeEventTraversing, true)
                self.removeEventListener("touchmove", makeEventTraversing, true)
                self.removeEventListener("mouseout", makeEventTraversing, true)
                document.removeEventListener("mouseup",up,true)
                document.removeEventListener("touchend",up,true)
            }

        self.addEventListener("mousedown", down, true)
        self.addEventListener("touchstart", down, true)


        this.on('disableTraversingGestures',function() {
            self.removeEventListener("mousedown", down, true)
            self.removeEventListener("touchstart", down, true)
        })


        return this

    }


    $document.on('mousedown',function(e){

        if (e.originalEvent.sourceCapabilities && e.originalEvent.sourceCapabilities.firesTouchEvents) return

        $(e.target).trigger('fake-click')

        if (e.button==2)  {
            e.preventDefault()
            $(e.target).trigger('fake-right-click',e)
        }

    })

    var touchTapTimer = false,
        clearTouchTapTimer = function() {
            clearTimeout(touchTapTimer)
            touchTapTimer = false
        }

    $document.on(events.touch.start,function(e){
        $(e.target).trigger('fake-click')

        if (!touchTapTimer&&e.originalEvent.touches.length==1) {
            touchTapTimer = setTimeout(function(){
                if (touchTapTimer) {
                    var touch = e.originalEvent.changedTouches[0],
                        off = getOffset(touch.target)

                    touch.offsetX = touch.pageX-off.left
                    touch.offsetY = touch.pageY-off.top
                    $(e.originalEvent.changedTouches[0].target).trigger('fake-right-click',touch)
                }
                touchTapTimer = false
            },600)
        } else {
            clearTouchTapTimer()
        }
    })

    $document.on(events.touch.stop + ' ' + events.touch.move,function(e){
        clearTouchTapTimer()
    })

    $document.on('contextmenu',function(){return false})

})(jQuery)
