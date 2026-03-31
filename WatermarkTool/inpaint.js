/**
 * inpaint.js - 图像修复算法
 * 实现基于 Telea 快速行进法 (FMM) 的图像修复
 * 参考论文: A. Telea, "An Image Inpainting Technique Based on the Fast Marching Method"
 * 核心思路：从掩码边缘向内逐像素修复，每个像素的颜色由周围已知像素
 * 根据距离、方向（等照度线）和像素级别加权插值得到
 */

const Inpainter = {

    /* ==================== 水印自动检测 ==================== */
    detectWatermark(imageData, width, height) {
        const data = imageData.data;
        const blockSize = Math.max(16, Math.min(32, Math.floor(Math.min(width, height) / 30)));
        const cols = Math.ceil(width / blockSize);
        const rows = Math.ceil(height / blockSize);

        // 全图平均亮度
        let globalLumSum = 0;
        const totalPixels = width * height;
        for (let i = 0; i < totalPixels; i++) {
            const j = i * 4;
            globalLumSum += 0.299 * data[j] + 0.587 * data[j+1] + 0.114 * data[j+2];
        }
        const globalAvgLum = globalLumSum / totalPixels;

        const blockScores = new Float32Array(cols * rows);
        for (let by = 0; by < rows; by++) {
            for (let bx = 0; bx < cols; bx++) {
                const x0 = bx * blockSize, y0 = by * blockSize;
                const x1 = Math.min(x0 + blockSize, width);
                const y1 = Math.min(y0 + blockSize, height);
                let brightCount = 0, count = 0, lumSum = 0;
                for (let y = y0; y < y1; y++) {
                    for (let x = x0; x < x1; x++) {
                        const i = (y * width + x) * 4;
                        const lum = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
                        const mx = Math.max(data[i], data[i+1], data[i+2]);
                        const mn = Math.min(data[i], data[i+1], data[i+2]);
                        const sat = mx > 0 ? (mx - mn) / mx : 0;
                        lumSum += lum;
                        if (lum > globalAvgLum + 40 && sat < 0.2) brightCount++;
                        count++;
                    }
                }
                const ratio = brightCount / count;
                const blockAvgLum = lumSum / count;
                if (ratio > 0.08 && ratio < 0.6 && blockAvgLum > globalAvgLum + 15) {
                    blockScores[by * cols + bx] = ratio;
                }
            }
        }

        const edgeMap = this._detectEdges(data, width, height);
        const combined = new Float32Array(cols * rows);
        for (let by = 0; by < rows; by++) {
            for (let bx = 0; bx < cols; bx++) {
                let edgeCount = 0, total = 0;
                const x0 = bx * blockSize, y0 = by * blockSize;
                const x1 = Math.min(x0 + blockSize, width);
                const y1 = Math.min(y0 + blockSize, height);
                for (let y = y0; y < y1; y++)
                    for (let x = x0; x < x1; x++) {
                        if (edgeMap[y * width + x] > 40) edgeCount++;
                        total++;
                    }
                const bi = by * cols + bx;
                const edgeRatio = edgeCount / total;
                if (blockScores[bi] > 0 && edgeRatio > 0.02)
                    combined[bi] = blockScores[bi] * (1 + edgeRatio * 3);
            }
        }

        // 连通区域聚类
        const threshold = 0.05;
        const visited = new Uint8Array(cols * rows);
        const clusterRegions = [];
        for (let i = 0; i < combined.length; i++) {
            if (combined[i] > threshold && !visited[i]) {
                const cluster = [];
                const queue = [i];
                visited[i] = 1;
                while (queue.length > 0) {
                    const idx = queue.shift();
                    cluster.push(idx);
                    const cx = idx % cols, cy = (idx / cols) | 0;
                    for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                        const nx = cx+dx, ny = cy+dy;
                        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                            const ni = ny * cols + nx;
                            if (!visited[ni] && combined[ni] > threshold * 0.6) {
                                visited[ni] = 1;
                                queue.push(ni);
                            }
                        }
                    }
                }
                if (cluster.length >= 2) {
                    let minX = width, minY = height, maxX = 0, maxY = 0;
                    for (const idx of cluster) {
                        const cx = (idx % cols) * blockSize;
                        const cy = ((idx / cols) | 0) * blockSize;
                        minX = Math.min(minX, cx);
                        minY = Math.min(minY, cy);
                        maxX = Math.max(maxX, Math.min(cx + blockSize, width));
                        maxY = Math.max(maxY, Math.min(cy + blockSize, height));
                    }
                    const pad = Math.round(blockSize * 0.3);
                    minX = Math.max(0, minX - pad);
                    minY = Math.max(0, minY - pad);
                    maxX = Math.min(width, maxX + pad);
                    maxY = Math.min(height, maxY + pad);
                    const rw = maxX - minX, rh = maxY - minY;
                    const area = rw * rh, imgArea = width * height;
                    if (area > imgArea * 0.001 && area < imgArea * 0.3) {
                        clusterRegions.push({
                            x: Math.round(minX), y: Math.round(minY),
                            w: Math.round(rw), h: Math.round(rh),
                            score: cluster.reduce((s, i) => s + combined[i], 0) / cluster.length
                        });
                    }
                }
            }
        }
        clusterRegions.sort((a, b) => b.score - a.score);
        return clusterRegions.slice(0, 5);
    },

    _detectEdges(data, width, height) {
        const gray = new Float32Array(width * height);
        for (let i = 0; i < width * height; i++) {
            const j = i * 4;
            gray[i] = 0.299*data[j] + 0.587*data[j+1] + 0.114*data[j+2];
        }
        const edges = new Float32Array(width * height);
        for (let y = 1; y < height-1; y++)
            for (let x = 1; x < width-1; x++) {
                const gx = -gray[(y-1)*width+x-1]+gray[(y-1)*width+x+1]
                    -2*gray[y*width+x-1]+2*gray[y*width+x+1]
                    -gray[(y+1)*width+x-1]+gray[(y+1)*width+x+1];
                const gy = -gray[(y-1)*width+x-1]-2*gray[(y-1)*width+x]-gray[(y-1)*width+x+1]
                    +gray[(y+1)*width+x-1]+2*gray[(y+1)*width+x]+gray[(y+1)*width+x+1];
                edges[y*width+x] = Math.sqrt(gx*gx+gy*gy);
            }
        return edges;
    },

    /* ==================== Telea FMM 图像修复 ==================== */

    // 像素状态常量
    KNOWN: 0,   // 已知像素（原始或已修复）
    BAND: 1,    // 窄带（待处理边界）
    INSIDE: 2,  // 掩码内部（待修复）

    /**
     * 基于 Telea 快速行进法的图像修复
     * 从掩码边缘开始，按距离由近到远逐像素修复
     * 每个像素的颜色由周围已知像素加权插值，权重考虑：
     * 1. 距离衰减
     * 2. 等照度线方向（梯度垂直方向）
     * 3. 像素到修复点连线与梯度的一致性
     */
    inpaint(imageData, mask, width, height, strength, onProgress) {
        const src = new Float32Array(imageData.data.length);
        for (let i = 0; i < imageData.data.length; i++) src[i] = imageData.data[i];

        const radius = Math.max(5, strength + 3);

        // 初始化状态和距离图
        const flag = new Uint8Array(width * height);  // 0=KNOWN, 1=BAND, 2=INSIDE
        const dist = new Float32Array(width * height);
        dist.fill(1e6);

        // 标记掩码内部像素
        for (let i = 0; i < width * height; i++) {
            if (mask[i] === 255) {
                flag[i] = 2; // INSIDE
            } else {
                flag[i] = 0; // KNOWN
                dist[i] = 0;
            }
        }

        // 找到掩码边界像素（BAND）：掩码内部但邻接已知像素
        // 用最小堆管理窄带
        const heap = new MinHeap();

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const i = y * width + x;
                if (flag[i] !== 2) continue; // 只看掩码内部

                // 检查4邻域是否有已知像素
                let hasKnown = false;
                if (flag[i-1] === 0 || flag[i+1] === 0 ||
                    flag[i-width] === 0 || flag[i+width] === 0) {
                    hasKnown = true;
                }

                if (hasKnown) {
                    flag[i] = 1; // BAND
                    dist[i] = 1;
                    heap.push(i, 1);
                }
            }
        }

        // 快速行进：每次取距离最小的 BAND 像素，修复它，然后更新邻居
        let processed = 0;
        const totalMask = mask.reduce((s, v) => s + (v === 255 ? 1 : 0), 0);

        while (heap.size() > 0) {
            const { idx } = heap.pop();
            const x = idx % width;
            const y = (idx / width) | 0;

            if (flag[idx] === 0) continue; // 已经处理过了

            // 用 Telea 方法修复这个像素
            this._inpaintPixel(src, flag, dist, x, y, width, height, radius);
            flag[idx] = 0; // 标记为已知

            // 更新4邻域
            const neighbors = [
                idx - 1, idx + 1, idx - width, idx + width
            ];
            const nx_arr = [x-1, x+1, x, x];
            const ny_arr = [y, y, y-1, y+1];

            for (let n = 0; n < 4; n++) {
                const ni = neighbors[n];
                const nx = nx_arr[n], ny = ny_arr[n];
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

                if (flag[ni] === 2) {
                    // 从 INSIDE 变为 BAND
                    flag[ni] = 1;
                    dist[ni] = dist[idx] + 1;
                    heap.push(ni, dist[ni]);
                } else if (flag[ni] === 1 && dist[idx] + 1 < dist[ni]) {
                    // 更新距离
                    dist[ni] = dist[idx] + 1;
                    heap.push(ni, dist[ni]); // 堆里可能有重复，靠 flag 检查过滤
                }
            }

            processed++;
            if (onProgress && processed % 2000 === 0) {
                onProgress(Math.min(0.95, processed / totalMask));
            }
        }

        // 最终平滑过渡
        this._postSmooth(src, mask, width, height, Math.max(1, Math.ceil(strength / 3)));

        const result = new Uint8ClampedArray(src.length);
        for (let i = 0; i < src.length; i++) result[i] = Math.round(src[i]);
        if (onProgress) onProgress(1);
        return new ImageData(result, width, height);
    },

    /**
     * Telea 方法修复单个像素
     * 在半径范围内找所有已知像素，根据三个权重因子加权插值：
     * w = w_dir * w_dist * w_level
     * - w_dir: 方向权重，修复点到采样点的方向与该处梯度（等照度线法线）的一致性
     * - w_dist: 距离权重，1/(距离^2)
     * - w_level: 层级权重，优先使用原始像素而非已修复像素
     */
    _inpaintPixel(src, flag, dist, x, y, width, height, radius) {
        const idx = y * width + x;
        let rSum = 0, gSum = 0, bSum = 0, wTotal = 0;

        // 计算修复点处的梯度（用已知邻居估算）
        const gradX = this._getGradient(src, flag, x, y, width, height, 'x');
        const gradY = this._getGradient(src, flag, x, y, width, height, 'y');

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                const ni = ny * width + nx;
                if (flag[ni] !== 0) continue; // 只用已知像素

                const d = Math.sqrt(dx * dx + dy * dy);
                if (d > radius || d < 0.5) continue;

                // 1. 方向权重：采样方向与梯度的点积
                const dirX = dx / d;
                const dirY = dy / d;
                // 梯度方向的归一化
                const gradLen = Math.sqrt(gradX * gradX + gradY * gradY) + 1e-6;
                const dotProduct = Math.abs(dirX * gradX / gradLen + dirY * gradY / gradLen);
                const wDir = dotProduct + 0.3; // 加偏置避免权重为0

                // 2. 距离权重
                const wDist = 1.0 / (d * d);

                // 3. 层级权重：原始像素（dist=0）权重更高
                const wLevel = 1.0 / (1.0 + dist[ni]);

                const w = wDir * wDist * wLevel;

                const pi = ni * 4;
                rSum += src[pi] * w;
                gSum += src[pi + 1] * w;
                bSum += src[pi + 2] * w;
                wTotal += w;
            }
        }

        const pi = idx * 4;
        if (wTotal > 0) {
            src[pi]     = rSum / wTotal;
            src[pi + 1] = gSum / wTotal;
            src[pi + 2] = bSum / wTotal;
            src[pi + 3] = 255;
        }
    },

    /** 估算某点的梯度（用已知邻居的亮度差） */
    _getGradient(src, flag, x, y, width, height, axis) {
        let v1 = -1, v2 = -1;
        if (axis === 'x') {
            // 左右邻居
            if (x > 0 && flag[y * width + x - 1] === 0) {
                const i = (y * width + x - 1) * 4;
                v1 = 0.299*src[i] + 0.587*src[i+1] + 0.114*src[i+2];
            }
            if (x < width-1 && flag[y * width + x + 1] === 0) {
                const i = (y * width + x + 1) * 4;
                v2 = 0.299*src[i] + 0.587*src[i+1] + 0.114*src[i+2];
            }
        } else {
            // 上下邻居
            if (y > 0 && flag[(y-1) * width + x] === 0) {
                const i = ((y-1) * width + x) * 4;
                v1 = 0.299*src[i] + 0.587*src[i+1] + 0.114*src[i+2];
            }
            if (y < height-1 && flag[(y+1) * width + x] === 0) {
                const i = ((y+1) * width + x) * 4;
                v2 = 0.299*src[i] + 0.587*src[i+1] + 0.114*src[i+2];
            }
        }
        if (v1 >= 0 && v2 >= 0) return (v2 - v1) / 2;
        if (v1 >= 0) return 0;
        if (v2 >= 0) return 0;
        return 0;
    },

    /** 修复后的边界平滑处理 */
    _postSmooth(src, mask, width, height, passes) {
        for (let pass = 0; pass < passes; pass++) {
            const temp = new Float32Array(src);
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = y * width + x;
                    if (mask[idx] !== 255) continue;

                    // 只平滑掩码边界附近的像素（3像素范围内）
                    let nearBorder = false;
                    outer:
                    for (let dy = -3; dy <= 3; dy++) {
                        for (let dx = -3; dx <= 3; dx++) {
                            const nx = x+dx, ny = y+dy;
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                if (mask[ny*width+nx] === 0) { nearBorder = true; break outer; }
                            }
                        }
                    }
                    if (!nearBorder) continue;

                    // 3x3 高斯核
                    const pi = idx * 4;
                    for (let c = 0; c < 3; c++) {
                        let sum = 0, w = 0;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const ni = ((y+dy)*width+(x+dx)) * 4 + c;
                                const wt = (dx === 0 && dy === 0) ? 4 : (dx === 0 || dy === 0) ? 2 : 1;
                                sum += temp[ni] * wt;
                                w += wt;
                            }
                        }
                        src[pi + c] = sum / w;
                    }
                }
            }
        }
    },

    /* ==================== 智能掩码生成 ==================== */

    generateSmartMask(imageData, region, width, height) {
        const data = imageData.data;
        const mask = new Uint8Array(width * height);
        const { x, y, w, h } = region;

        // 收集选区边缘像素的颜色作为"背景参考"
        const bgSamples = [];
        const sampleBorder = 3; // 取边缘3像素作为背景样本
        for (let py = y; py < y + h && py < height; py++) {
            for (let px = x; px < x + w && px < width; px++) {
                const inBorder = (px < x + sampleBorder || px >= x + w - sampleBorder ||
                                  py < y + sampleBorder || py >= y + h - sampleBorder);
                if (inBorder) {
                    const i = (py * width + px) * 4;
                    bgSamples.push({
                        r: data[i], g: data[i+1], b: data[i+2],
                        lum: 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]
                    });
                }
            }
        }

        // 计算背景的平均颜色和亮度
        let bgR = 0, bgG = 0, bgB = 0, bgLum = 0;
        for (const s of bgSamples) {
            bgR += s.r; bgG += s.g; bgB += s.b; bgLum += s.lum;
        }
        const n = bgSamples.length || 1;
        bgR /= n; bgG /= n; bgB /= n; bgLum /= n;

        // 计算背景颜色的标准差
        let bgVar = 0;
        for (const s of bgSamples) {
            const diff = Math.abs(s.lum - bgLum);
            bgVar += diff * diff;
        }
        const bgStd = Math.sqrt(bgVar / n);

        // 阈值：偏离背景颜色超过一定程度的像素视为水印
        const threshold = Math.max(bgStd * 1.5, 12);

        for (let py = y; py < y + h && py < height; py++) {
            for (let px = x; px < x + w && px < width; px++) {
                const i = (py * width + px) * 4;
                const r = data[i], g = data[i+1], b = data[i+2];
                // 与背景的颜色差异
                const colorDiff = Math.sqrt(
                    (r - bgR) * (r - bgR) +
                    (g - bgG) * (g - bgG) +
                    (b - bgB) * (b - bgB)
                ) / 1.732; // 归一化到单通道范围

                if (colorDiff > threshold) {
                    mask[py * width + px] = 255;
                }
            }
        }

        // 膨胀1像素确保覆盖边缘
        return this._dilate(mask, width, height, 1);
    },

    _dilate(mask, width, height, radius) {
        const result = new Uint8Array(mask);
        for (let y = 0; y < height; y++)
            for (let x = 0; x < width; x++) {
                if (mask[y*width+x] !== 255) continue;
                for (let dy = -radius; dy <= radius; dy++)
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = x+dx, ny = y+dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height)
                            result[ny*width+nx] = 255;
                    }
            }
        return result;
    }
};


/** 最小堆，用于快速行进法的优先队列 */
class MinHeap {
    constructor() { this.data = []; }
    size() { return this.data.length; }
    push(idx, priority) {
        this.data.push({ idx, priority });
        this._bubbleUp(this.data.length - 1);
    }
    pop() {
        const top = this.data[0];
        const last = this.data.pop();
        if (this.data.length > 0) {
            this.data[0] = last;
            this._sinkDown(0);
        }
        return top;
    }
    _bubbleUp(i) {
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.data[i].priority < this.data[parent].priority) {
                [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
                i = parent;
            } else break;
        }
    }
    _sinkDown(i) {
        const n = this.data.length;
        while (true) {
            let smallest = i;
            const l = 2*i+1, r = 2*i+2;
            if (l < n && this.data[l].priority < this.data[smallest].priority) smallest = l;
            if (r < n && this.data[r].priority < this.data[smallest].priority) smallest = r;
            if (smallest !== i) {
                [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
                i = smallest;
            } else break;
        }
    }
}
