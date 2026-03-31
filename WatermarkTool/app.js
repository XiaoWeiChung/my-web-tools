/**
 * app.js - 水印工坊主逻辑
 */

(function() {
    'use strict';

    // ========== 状态 ==========
    const state = {
        mode: 'remove',         // 'remove' | 'add'
        originalImage: null,    // HTMLImageElement
        imageData: null,        // ImageData
        imgWidth: 0,
        imgHeight: 0,
        // 去水印
        tool: 'none',           // 'none' | 'select' | 'brush'
        regions: [],            // 检测/选择的区域 [{x,y,w,h}]
        mask: null,             // Uint8Array 掩码
        isSelecting: false,
        selectStart: null,
        isBrushing: false,
        brushSize: 20,
        inpaintStrength: 6,
        resultData: null,       // 修复后的 ImageData
        // 加水印
        wmFont: 'Orbitron',
        wmFontSize: 36,
        wmText: 'SAMPLE',
        wmColor: '#ffffff',
        wmOpacity: 30,
        wmRotation: -30,
        wmMode: 'tile',         // 'tile' | 'single'
        wmPosition: 'center',
        wmSpacing: 150,
    };

    // ========== DOM ==========
    const $ = id => document.getElementById(id);
    const uploadZone = $('uploadZone');
    const fileInput = $('fileInput');
    const workspace = $('workspace');
    const panelRemove = $('panelRemove');
    const panelAdd = $('panelAdd');
    const mainCanvas = $('mainCanvas');
    const maskCanvas = $('maskCanvas');
    const addCanvas = $('addCanvas');
    const mainCtx = mainCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    const addCtx = addCanvas.getContext('2d');
    const canvasWrapper = $('canvasWrapper');
    const canvasInner = $('canvasInner');
    const selectionBox = $('selectionBox');
    const processingOverlay = $('processingOverlay');
    const processingText = $('processingText');
    const progressFill = $('progressFill');

    // ========== 模式切换 ==========
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.mode = btn.dataset.mode;
            updatePanelVisibility();
        });
    });

    function updatePanelVisibility() {
        if (!state.originalImage) return;
        panelRemove.style.display = state.mode === 'remove' ? 'flex' : 'none';
        panelAdd.style.display = state.mode === 'add' ? 'flex' : 'none';
        if (state.mode === 'add') renderWatermarkPreview();
    }

    // ========== 文件上传 ==========
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', e => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFile(fileInput.files[0]);
    });
    $('btnReupload').addEventListener('click', () => {
        fileInput.value = '';
        fileInput.click();
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) return alert('请上传图片文件');
        if (file.size > 20 * 1024 * 1024) return alert('文件大小不能超过 20MB');

        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                state.originalImage = img;
                state.imgWidth = img.width;
                state.imgHeight = img.height;
                state.regions = [];
                state.mask = null;
                state.resultData = null;

                $('fileName').textContent = file.name;
                $('fileSize').textContent = `${img.width}×${img.height}`;

                uploadZone.style.display = 'none';
                workspace.style.display = 'block';

                initRemoveCanvas();
                initAddCanvas();
                updatePanelVisibility();
                resetToolState();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // ========== 去水印 Canvas ==========
    function initRemoveCanvas() {
        const { imgWidth, imgHeight } = state;
        mainCanvas.width = imgWidth;
        mainCanvas.height = imgHeight;
        maskCanvas.width = imgWidth;
        maskCanvas.height = imgHeight;
        mainCtx.drawImage(state.originalImage, 0, 0);
        maskCtx.clearRect(0, 0, imgWidth, imgHeight);
        state.imageData = mainCtx.getImageData(0, 0, imgWidth, imgHeight);
        state.mask = new Uint8Array(imgWidth * imgHeight);
    }

    function drawMask() {
        const { imgWidth, imgHeight, mask } = state;
        maskCtx.clearRect(0, 0, imgWidth, imgHeight);
        if (!mask) return;

        const imgData = maskCtx.createImageData(imgWidth, imgHeight);
        for (let i = 0; i < mask.length; i++) {
            if (mask[i] === 255) {
                imgData.data[i * 4] = 255;     // R - magenta
                imgData.data[i * 4 + 1] = 0;
                imgData.data[i * 4 + 2] = 170;
                imgData.data[i * 4 + 3] = 120;
            }
        }
        maskCtx.putImageData(imgData, 0, 0);
    }

    function drawRegionOverlays() {
        // 在 mask canvas 上画区域框
        maskCtx.clearRect(0, 0, state.imgWidth, state.imgHeight);
        drawMask();

        maskCtx.strokeStyle = '#00f0ff';
        maskCtx.lineWidth = 2;
        maskCtx.setLineDash([6, 4]);
        for (const r of state.regions) {
            maskCtx.strokeRect(r.x, r.y, r.w, r.h);
        }
        maskCtx.setLineDash([]);
    }

    // ========== 工具按钮 ==========
    $('btnAutoDetect').addEventListener('click', autoDetect);
    $('btnManualSelect').addEventListener('click', () => toggleTool('select'));
    $('btnBrush').addEventListener('click', () => toggleTool('brush'));
    $('btnInpaint').addEventListener('click', executeInpaint);
    $('btnReset').addEventListener('click', resetAll);
    $('btnDownloadRemove').addEventListener('click', downloadRemoveResult);

    $('brushSize').addEventListener('input', e => {
        state.brushSize = parseInt(e.target.value);
        $('brushSizeVal').textContent = state.brushSize + 'px';
    });
    $('inpaintStrength').addEventListener('input', e => {
        state.inpaintStrength = parseInt(e.target.value);
        $('strengthVal').textContent = e.target.value;
    });

    function toggleTool(tool) {
        if (state.tool === tool) {
            state.tool = 'none';
            $('btnManualSelect').classList.remove('active-tool');
            $('btnBrush').classList.remove('active-tool');
            canvasInner.style.cursor = 'default';
        } else {
            state.tool = tool;
            $('btnManualSelect').classList.toggle('active-tool', tool === 'select');
            $('btnBrush').classList.toggle('active-tool', tool === 'brush');
            canvasInner.style.cursor = 'crosshair';
        }
    }

    function resetToolState() {
        state.tool = 'none';
        state.regions = [];
        state.mask = new Uint8Array(state.imgWidth * state.imgHeight);
        state.resultData = null;
        $('btnManualSelect').classList.remove('active-tool');
        $('btnBrush').classList.remove('active-tool');
        $('btnInpaint').disabled = true;
        $('btnDownloadRemove').disabled = true;
        $('detectedRegions').style.display = 'none';
        canvasInner.style.cursor = 'default';
    }

    function resetAll() {
        if (!state.originalImage) return;
        initRemoveCanvas();
        resetToolState();
    }

    function updateInpaintButton() {
        const hasMask = state.mask && state.mask.some(v => v === 255);
        $('btnInpaint').disabled = !hasMask;
    }

    // ========== 自动检测 ==========
    async function autoDetect() {
        showProcessing('正在分析图像，检测水印位置...');
        await sleep(100);

        const regions = Inpainter.detectWatermark(state.imageData, state.imgWidth, state.imgHeight);
        hideProcessing();

        if (regions.length === 0) {
            alert('未检测到明显的水印区域。\n请尝试手动框选或使用画笔涂抹水印位置。');
            return;
        }

        state.regions = regions;
        // 为检测到的区域生成掩码
        state.mask = new Uint8Array(state.imgWidth * state.imgHeight);
        for (const r of regions) {
            const smartMask = Inpainter.generateSmartMask(
                state.imageData, r, state.imgWidth, state.imgHeight
            );
            for (let i = 0; i < smartMask.length; i++) {
                if (smartMask[i] === 255) state.mask[i] = 255;
            }
        }

        drawRegionOverlays();
        showDetectedRegions();
        updateInpaintButton();
    }

    function showDetectedRegions() {
        const container = $('detectedRegions');
        const list = $('regionList');
        list.innerHTML = '';
        container.style.display = state.regions.length ? 'block' : 'none';

        state.regions.forEach((r, i) => {
            const div = document.createElement('div');
            div.className = 'region-item';
            div.innerHTML = `
                <span class="region-info">区域 ${i+1}: ${Math.round(r.w)}×${Math.round(r.h)} @ (${Math.round(r.x)},${Math.round(r.y)})</span>
                <button class="region-remove" data-idx="${i}">✕</button>
            `;
            list.appendChild(div);
        });

        list.querySelectorAll('.region-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                state.regions.splice(idx, 1);
                // 重新生成掩码
                regenerateMaskFromRegions();
                drawRegionOverlays();
                showDetectedRegions();
                updateInpaintButton();
            });
        });
    }

    function regenerateMaskFromRegions() {
        state.mask = new Uint8Array(state.imgWidth * state.imgHeight);
        for (const r of state.regions) {
            const smartMask = Inpainter.generateSmartMask(
                state.imageData, r, state.imgWidth, state.imgHeight
            );
            for (let i = 0; i < smartMask.length; i++) {
                if (smartMask[i] === 255) state.mask[i] = 255;
            }
        }
    }

    // ========== 手动框选 ==========
    canvasInner.addEventListener('mousedown', onCanvasMouseDown);
    canvasInner.addEventListener('mousemove', onCanvasMouseMove);
    canvasInner.addEventListener('mouseup', onCanvasMouseUp);
    canvasInner.addEventListener('mouseleave', onCanvasMouseUp);
    // 触摸支持
    canvasInner.addEventListener('touchstart', onTouchStart, { passive: false });
    canvasInner.addEventListener('touchmove', onTouchMove, { passive: false });
    canvasInner.addEventListener('touchend', onTouchEnd);

    function getCanvasCoords(e) {
        const rect = mainCanvas.getBoundingClientRect();
        const scaleX = state.imgWidth / rect.width;
        const scaleY = state.imgHeight / rect.height;
        return {
            x: Math.max(0, Math.min(state.imgWidth, (e.clientX - rect.left) * scaleX)),
            y: Math.max(0, Math.min(state.imgHeight, (e.clientY - rect.top) * scaleY))
        };
    }

    function onCanvasMouseDown(e) {
        if (state.tool === 'select') {
            state.isSelecting = true;
            state.selectStart = getCanvasCoords(e);
        } else if (state.tool === 'brush') {
            state.isBrushing = true;
            brushAt(getCanvasCoords(e));
        }
    }

    function onCanvasMouseMove(e) {
        if (state.tool === 'select' && state.isSelecting) {
            const pos = getCanvasCoords(e);
            const sx = Math.min(state.selectStart.x, pos.x);
            const sy = Math.min(state.selectStart.y, pos.y);
            const sw = Math.abs(pos.x - state.selectStart.x);
            const sh = Math.abs(pos.y - state.selectStart.y);

            // 显示选择框（CSS 坐标，相对于 canvasInner）
            const rect = mainCanvas.getBoundingClientRect();
            const scaleX = rect.width / state.imgWidth;
            const scaleY = rect.height / state.imgHeight;
            selectionBox.style.display = 'block';
            selectionBox.style.left = Math.round(sx * scaleX) + 'px';
            selectionBox.style.top = Math.round(sy * scaleY) + 'px';
            selectionBox.style.width = Math.round(sw * scaleX) + 'px';
            selectionBox.style.height = Math.round(sh * scaleY) + 'px';
        } else if (state.tool === 'brush' && state.isBrushing) {
            brushAt(getCanvasCoords(e));
        }
    }

    function onCanvasMouseUp(e) {
        if (state.tool === 'select' && state.isSelecting) {
            state.isSelecting = false;
            selectionBox.style.display = 'none';

            if (state.selectStart) {
                const pos = getCanvasCoords(e);
                const x = Math.max(0, Math.min(state.selectStart.x, pos.x));
                const y = Math.max(0, Math.min(state.selectStart.y, pos.y));
                const w = Math.min(Math.abs(pos.x - state.selectStart.x), state.imgWidth - x);
                const h = Math.min(Math.abs(pos.y - state.selectStart.y), state.imgHeight - y);

                if (w > 5 && h > 5) {
                    const region = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
                    state.regions.push(region);

                    // 为这个区域生成掩码
                    const smartMask = Inpainter.generateSmartMask(
                        state.imageData, region, state.imgWidth, state.imgHeight
                    );
                    for (let i = 0; i < smartMask.length; i++) {
                        if (smartMask[i] === 255) state.mask[i] = 255;
                    }

                    drawRegionOverlays();
                    showDetectedRegions();
                    updateInpaintButton();
                }
            }
        }
        if (state.tool === 'brush') {
            state.isBrushing = false;
        }
    }

    function brushAt(pos) {
        const r = state.brushSize;
        const cx = Math.round(pos.x);
        const cy = Math.round(pos.y);

        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= r * r) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < state.imgWidth && ny >= 0 && ny < state.imgHeight) {
                        state.mask[ny * state.imgWidth + nx] = 255;
                    }
                }
            }
        }
        drawMask();
        updateInpaintButton();
    }

    // 触摸事件
    function onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        onCanvasMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }
    function onTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        onCanvasMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }
    function onTouchEnd(e) {
        const touch = e.changedTouches[0];
        onCanvasMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
    }

    // ========== 执行修复 ==========
    async function executeInpaint() {
        if (!state.mask || !state.mask.some(v => v === 255)) return;

        showProcessing('正在执行图像修复...');
        await sleep(100);

        // 使用 setTimeout 让 UI 更新
        setTimeout(() => {
            const result = Inpainter.inpaint(
                state.imageData,
                state.mask,
                state.imgWidth,
                state.imgHeight,
                state.inpaintStrength,
                progress => {
                    progressFill.style.width = Math.round(progress * 100) + '%';
                }
            );

            state.resultData = result;
            mainCtx.putImageData(result, 0, 0);
            maskCtx.clearRect(0, 0, state.imgWidth, state.imgHeight);

            // 更新 imageData 以便继续操作
            state.imageData = mainCtx.getImageData(0, 0, state.imgWidth, state.imgHeight);
            state.mask = new Uint8Array(state.imgWidth * state.imgHeight);
            state.regions = [];
            $('detectedRegions').style.display = 'none';

            $('btnDownloadRemove').disabled = false;
            $('btnInpaint').disabled = true;
            hideProcessing();
        }, 50);
    }

    function downloadRemoveResult() {
        const link = document.createElement('a');
        link.download = 'watermark_removed.png';
        link.href = mainCanvas.toDataURL('image/png');
        link.click();
    }

    // ========== 加水印 ==========
    function initAddCanvas() {
        addCanvas.width = state.imgWidth;
        addCanvas.height = state.imgHeight;
        renderWatermarkPreview();
    }

    function renderWatermarkPreview() {
        if (!state.originalImage) return;
        const { imgWidth, imgHeight } = state;
        addCtx.clearRect(0, 0, imgWidth, imgHeight);
        addCtx.drawImage(state.originalImage, 0, 0);

        const { wmText, wmFont, wmFontSize, wmColor, wmOpacity, wmRotation, wmMode, wmPosition, wmSpacing } = state;
        if (!wmText) return;

        addCtx.save();
        addCtx.globalAlpha = wmOpacity / 100;
        addCtx.fillStyle = wmColor;
        addCtx.font = `${wmFontSize}px "${wmFont}"`;
        addCtx.textAlign = 'center';
        addCtx.textBaseline = 'middle';

        if (wmMode === 'tile') {
            // 平铺模式
            const rad = wmRotation * Math.PI / 180;
            const spacing = wmSpacing + wmFontSize;
            const diagonal = Math.sqrt(imgWidth * imgWidth + imgHeight * imgHeight);

            addCtx.translate(imgWidth / 2, imgHeight / 2);
            addCtx.rotate(rad);

            for (let y = -diagonal; y < diagonal; y += spacing) {
                for (let x = -diagonal; x < diagonal; x += spacing + wmText.length * wmFontSize * 0.4) {
                    addCtx.fillText(wmText, x, y);
                }
            }
        } else {
            // 单个模式
            const rad = wmRotation * Math.PI / 180;
            let tx, ty;
            const margin = wmFontSize;

            switch (wmPosition) {
                case 'top-left':     tx = margin + wmFontSize * 2; ty = margin + wmFontSize; break;
                case 'top-center':   tx = imgWidth / 2; ty = margin + wmFontSize; break;
                case 'top-right':    tx = imgWidth - margin - wmFontSize * 2; ty = margin + wmFontSize; break;
                case 'center-left':  tx = margin + wmFontSize * 2; ty = imgHeight / 2; break;
                case 'center':       tx = imgWidth / 2; ty = imgHeight / 2; break;
                case 'center-right': tx = imgWidth - margin - wmFontSize * 2; ty = imgHeight / 2; break;
                case 'bottom-left':  tx = margin + wmFontSize * 2; ty = imgHeight - margin - wmFontSize; break;
                case 'bottom-center':tx = imgWidth / 2; ty = imgHeight - margin - wmFontSize; break;
                case 'bottom-right': tx = imgWidth - margin - wmFontSize * 2; ty = imgHeight - margin - wmFontSize; break;
                default:             tx = imgWidth / 2; ty = imgHeight / 2;
            }

            addCtx.translate(tx, ty);
            addCtx.rotate(rad);
            addCtx.fillText(wmText, 0, 0);
        }

        addCtx.restore();
    }

    // 加水印控件事件
    $('wmText').addEventListener('input', e => { state.wmText = e.target.value; renderWatermarkPreview(); });
    $('wmFontSize').addEventListener('input', e => {
        state.wmFontSize = parseInt(e.target.value);
        $('wmFontSizeVal').textContent = e.target.value + 'px';
        renderWatermarkPreview();
    });
    $('wmColor').addEventListener('input', e => { state.wmColor = e.target.value; renderWatermarkPreview(); });
    $('wmOpacity').addEventListener('input', e => {
        state.wmOpacity = parseInt(e.target.value);
        $('wmOpacityVal').textContent = e.target.value + '%';
        renderWatermarkPreview();
    });
    $('wmRotation').addEventListener('input', e => {
        state.wmRotation = parseInt(e.target.value);
        $('wmRotationVal').textContent = e.target.value + '°';
        renderWatermarkPreview();
    });
    $('wmSpacing').addEventListener('input', e => {
        state.wmSpacing = parseInt(e.target.value);
        $('wmSpacingVal').textContent = e.target.value + 'px';
        renderWatermarkPreview();
    });

    // 字体选择
    $('fontOptions').addEventListener('click', e => {
        const btn = e.target.closest('.font-btn');
        if (!btn) return;
        document.querySelectorAll('.font-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.wmFont = btn.dataset.font;
        renderWatermarkPreview();
    });

    // 水印模式
    document.querySelectorAll('.wm-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.wm-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.wmMode = btn.dataset.wmMode;
            $('singlePosSection').style.display = state.wmMode === 'single' ? 'block' : 'none';
            $('tileSpacingSection').style.display = state.wmMode === 'tile' ? 'block' : 'none';
            renderWatermarkPreview();
        });
    });

    // 位置选择
    document.querySelectorAll('.pos-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.wmPosition = btn.dataset.pos;
            renderWatermarkPreview();
        });
    });

    // 下载加水印图片
    $('btnDownloadAdd').addEventListener('click', () => {
        if (!state.originalImage) return;
        const link = document.createElement('a');
        link.download = 'watermarked.png';
        link.href = addCanvas.toDataURL('image/png');
        link.click();
    });

    // ========== 工具函数 ==========
    function showProcessing(text) {
        processingText.textContent = text;
        progressFill.style.width = '0%';
        processingOverlay.style.display = 'flex';
    }
    function hideProcessing() {
        processingOverlay.style.display = 'none';
    }
    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

})();
