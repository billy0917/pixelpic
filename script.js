// 先進色彩分析工具類
class ColorAnalysisTools {
    // RGB 到 XYZ 色彩空間轉換
    static rgbToXyz(r, g, b) {
        // 標準化 RGB 值到 0-1 範圍
        r = r / 255;
        g = g / 255;
        b = b / 255;
        
        // 應用 sRGB gamma 校正
        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
        
        // 使用 sRGB 轉換矩陣
        const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
        const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
        const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
        
        return { x: x * 100, y: y * 100, z: z * 100 };
    }
    
    // XYZ 到 CIELAB 色彩空間轉換
    static xyzToLab(x, y, z) {
        // D65 標準照明體參考白點
        const xn = 95.047;
        const yn = 100.000;
        const zn = 108.883;
        
        x = x / xn;
        y = y / yn;
        z = z / zn;
        
        const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
        const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
        const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
        
        const L = 116 * fy - 16;
        const a = 500 * (fx - fy);
        const b = 200 * (fy - fz);
        
        return { L, a, b };
    }
    
    // RGB 直接轉換到 CIELAB
    static rgbToLab(r, g, b) {
        const xyz = this.rgbToXyz(r, g, b);
        return this.xyzToLab(xyz.x, xyz.y, xyz.z);
    }
    
    // CIELAB 轉換回 RGB
    static labToRgb(L, a, b) {
        // CIELAB 到 XYZ
        const fy = (L + 16) / 116;
        const fx = a / 500 + fy;
        const fz = fy - b / 200;
        
        const xn = 95.047;
        const yn = 100.000;
        const zn = 108.883;
        
        const x = (fx ** 3 > 0.008856 ? fx ** 3 : (fx - 16/116) / 7.787) * xn;
        const y = (fy ** 3 > 0.008856 ? fy ** 3 : (fy - 16/116) / 7.787) * yn;
        const z = (fz ** 3 > 0.008856 ? fz ** 3 : (fz - 16/116) / 7.787) * zn;
        
        // XYZ 到 RGB
        let r = x * 0.032406 + y * -0.015372 + z * -0.004986;
        let g = x * -0.009689 + y * 0.018758 + z * 0.000415;
        let blue = x * 0.000557 + y * -0.002040 + z * 0.010570;
        
        // 應用 gamma 校正
        r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r;
        g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g;
        blue = blue > 0.0031308 ? 1.055 * Math.pow(blue, 1/2.4) - 0.055 : 12.92 * blue;
        
        return {
            r: Math.max(0, Math.min(255, Math.round(r * 255))),
            g: Math.max(0, Math.min(255, Math.round(g * 255))),
            b: Math.max(0, Math.min(255, Math.round(blue * 255)))
        };
    }
    
    // HyAB 距離計算（2019年最新研究）
    static hyabDistance(lab1, lab2) {
        const deltaL = Math.abs(lab1.L - lab2.L);
        const deltaAB = Math.sqrt(
            Math.pow(lab1.a - lab2.a, 2) + 
            Math.pow(lab1.b - lab2.b, 2)
        );
        return deltaL + deltaAB;
    }
    
    // 傳統 CIELAB 歐氏距離（用於比較）
    static labDistance(lab1, lab2) {
        return Math.sqrt(
            Math.pow(lab1.L - lab2.L, 2) +
            Math.pow(lab1.a - lab2.a, 2) +
            Math.pow(lab1.b - lab2.b, 2)
        );
    }
    
    // CIE Delta E 2000 距離（最精確但計算複雜）
    static deltaE2000(lab1, lab2) {
        // 簡化版本的 Delta E 2000
        const kL = 1, kC = 1, kH = 1;
        
        const deltaL = lab2.L - lab1.L;
        const avgL = (lab1.L + lab2.L) / 2;
        
        const c1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
        const c2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
        const avgC = (c1 + c2) / 2;
        const deltaC = c2 - c1;
        
        const deltaH = Math.sqrt(
            Math.pow(lab2.a - lab1.a, 2) + 
            Math.pow(lab2.b - lab1.b, 2) - 
            deltaC * deltaC
        );
        
        const sL = 1 + (0.015 * Math.pow(avgL - 50, 2)) / Math.sqrt(20 + Math.pow(avgL - 50, 2));
        const sC = 1 + 0.045 * avgC;
        const sH = 1 + 0.015 * avgC;
        
        const dE00 = Math.sqrt(
            Math.pow(deltaL / (kL * sL), 2) +
            Math.pow(deltaC / (kC * sC), 2) +
            Math.pow(deltaH / (kH * sH), 2)
        );
        
        return dE00;
    }
    
    // 格子檢測功能
    static detectGrid(imageData, canvas) {
        const { data, width, height } = imageData;
        
        // 檢測水平和垂直線條
        const horizontalLines = this.detectHorizontalLines(data, width, height);
        const verticalLines = this.detectVerticalLines(data, width, height);
        
        if (horizontalLines.length > 1 && verticalLines.length > 1) {
            const gridWidth = verticalLines.length - 1;
            const gridHeight = horizontalLines.length - 1;
            
            return {
                detected: true,
                gridWidth,
                gridHeight,
                verticalLines,
                horizontalLines,
                cellWidth: Math.round((verticalLines[1] - verticalLines[0])),
                cellHeight: Math.round((horizontalLines[1] - horizontalLines[0]))
            };
        }
        
        return { detected: false };
    }
    
    static detectHorizontalLines(data, width, height) {
        const lines = [];
        const edgeThreshold = 30; // 邊緣檢測閾值
        
        for (let y = 1; y < height - 1; y++) {
            let edgeCount = 0;
            
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const idxAbove = ((y - 1) * width + x) * 4;
                const idxBelow = ((y + 1) * width + x) * 4;
                
                // 計算垂直方向的梯度
                const gradientR = Math.abs(data[idxAbove] - data[idxBelow]);
                const gradientG = Math.abs(data[idxAbove + 1] - data[idxBelow + 1]);
                const gradientB = Math.abs(data[idxAbove + 2] - data[idxBelow + 2]);
                
                const maxGradient = Math.max(gradientR, gradientG, gradientB);
                
                if (maxGradient > edgeThreshold) {
                    edgeCount++;
                }
            }
            
            // 如果邊緣點數量達到閾值，認為是格線
            if (edgeCount > width * 0.3) {
                lines.push(y);
            }
        }
        
        // 過濾掉太靠近的線條
        return this.filterCloseLines(lines, Math.max(5, Math.floor(height / 30)));
    }
    
    static detectVerticalLines(data, width, height) {
        const lines = [];
        const edgeThreshold = 30;
        
        for (let x = 1; x < width - 1; x++) {
            let edgeCount = 0;
            
            for (let y = 0; y < height; y++) {
                const idx = (y * width + x) * 4;
                const idxLeft = (y * width + (x - 1)) * 4;
                const idxRight = (y * width + (x + 1)) * 4;
                
                // 計算水平方向的梯度
                const gradientR = Math.abs(data[idxLeft] - data[idxRight]);
                const gradientG = Math.abs(data[idxLeft + 1] - data[idxRight + 1]);
                const gradientB = Math.abs(data[idxLeft + 2] - data[idxRight + 2]);
                
                const maxGradient = Math.max(gradientR, gradientG, gradientB);
                
                if (maxGradient > edgeThreshold) {
                    edgeCount++;
                }
            }
            
            // 如果邊緣點數量達到閾值，認為是格線
            if (edgeCount > height * 0.3) {
                lines.push(x);
            }
        }
        
        return this.filterCloseLines(lines, Math.max(5, Math.floor(width / 30)));
    }
    
    static colorSimilarity(color1, color2) {
        const rDiff = Math.abs(color1.r - color2.r);
        const gDiff = Math.abs(color1.g - color2.g);
        const bDiff = Math.abs(color1.b - color2.b);
        const maxDiff = Math.max(rDiff, gDiff, bDiff);
        return 1 - (maxDiff / 255);
    }
    
    static filterCloseLines(lines, minDistance) {
        if (lines.length === 0) return lines;
        
        const filtered = [lines[0]];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i] - filtered[filtered.length - 1] >= minDistance) {
                filtered.push(lines[i]);
            }
        }
        
        return filtered;
    }
    
    // 提取格子內容
    static extractCellColors(imageData, gridInfo) {
        const { data, width, height } = imageData;
        const { verticalLines, horizontalLines } = gridInfo;
        const cells = [];
        
        for (let row = 0; row < horizontalLines.length - 1; row++) {
            const cellRow = [];
            for (let col = 0; col < verticalLines.length - 1; col++) {
                const startX = verticalLines[col] + 1;
                const endX = verticalLines[col + 1] - 1;
                const startY = horizontalLines[row] + 1;
                const endY = horizontalLines[row + 1] - 1;
                
                const cellColor = this.getAverageCellColor(
                    data, width, startX, endX, startY, endY
                );
                
                cellRow.push(cellColor);
            }
            cells.push(cellRow);
        }
        
        return cells;
    }
    
    static getAverageCellColor(data, width, startX, endX, startY, endY) {
        let totalR = 0, totalG = 0, totalB = 0;
        let pixelCount = 0;
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (x >= 0 && x < width && y >= 0) {
                    const idx = (y * width + x) * 4;
                    totalR += data[idx];
                    totalG += data[idx + 1];
                    totalB += data[idx + 2];
                    pixelCount++;
                }
            }
        }
        
        return {
            r: Math.round(totalR / pixelCount),
            g: Math.round(totalG / pixelCount),
            b: Math.round(totalB / pixelCount)
        };
    }
}

// X-Means 自動聚類算法
class XMeansCluster {
    constructor(minK = 2, maxK = 16, maxIterations = 100) {
        this.minK = minK;
        this.maxK = maxK;
        this.maxIterations = maxIterations;
    }
    
    cluster(colors, distanceFunction = ColorAnalysisTools.hyabDistance) {
        let bestK = this.minK;
        let bestClusters = null;
        let bestBIC = Infinity;
        
        for (let k = this.minK; k <= this.maxK; k++) {
            const clusters = this.kMeansCluster(colors, k, distanceFunction);
            const bic = this.calculateBIC(colors, clusters, distanceFunction);
            
            if (bic < bestBIC) {
                bestBIC = bic;
                bestK = k;
                bestClusters = clusters;
            }
        }
        
        return {
            clusters: bestClusters,
            k: bestK,
            bic: bestBIC
        };
    }
    
    kMeansCluster(colors, k, distanceFunction) {
        // 初始化中心點
        let centroids = this.initializeCentroids(colors, k);
        let assignments = new Array(colors.length);
        let converged = false;
        let iterations = 0;
        
        while (!converged && iterations < this.maxIterations) {
            // 分配點到最近的中心
            const newAssignments = colors.map(color => {
                let minDistance = Infinity;
                let bestCentroid = 0;
                
                centroids.forEach((centroid, index) => {
                    const distance = distanceFunction(color, centroid);
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestCentroid = index;
                    }
                });
                
                return bestCentroid;
            });
            
            // 檢查是否收斂
            converged = JSON.stringify(assignments) === JSON.stringify(newAssignments);
            assignments = newAssignments;
            
            // 重新計算中心點
            if (!converged) {
                centroids = this.recalculateCentroids(colors, assignments, k);
            }
            
            iterations++;
        }
        
        return { centroids, assignments };
    }
    
    initializeCentroids(colors, k) {
        // K-means++ 初始化方法
        const centroids = [];
        
        // 隨機選擇第一個中心點
        centroids.push(colors[Math.floor(Math.random() * colors.length)]);
        
        // 選擇剩餘的中心點
        for (let i = 1; i < k; i++) {
            const distances = colors.map(color => {
                let minDist = Infinity;
                centroids.forEach(centroid => {
                    const dist = ColorAnalysisTools.hyabDistance(color, centroid);
                    if (dist < minDist) minDist = dist;
                });
                return minDist * minDist;
            });
            
            const totalDist = distances.reduce((sum, d) => sum + d, 0);
            let random = Math.random() * totalDist;
            
            for (let j = 0; j < colors.length; j++) {
                random -= distances[j];
                if (random <= 0) {
                    centroids.push(colors[j]);
                    break;
                }
            }
        }
        
        return centroids;
    }
    
    recalculateCentroids(colors, assignments, k) {
        const centroids = [];
        
        for (let i = 0; i < k; i++) {
            const clusterColors = colors.filter((_, index) => assignments[index] === i);
            
            if (clusterColors.length === 0) {
                // 如果群集為空，隨機選擇一個點
                centroids.push(colors[Math.floor(Math.random() * colors.length)]);
                continue;
            }
            
            // 計算平均值
            const avgL = clusterColors.reduce((sum, c) => sum + c.L, 0) / clusterColors.length;
            const avgA = clusterColors.reduce((sum, c) => sum + c.a, 0) / clusterColors.length;
            const avgB = clusterColors.reduce((sum, c) => sum + c.b, 0) / clusterColors.length;
            
            centroids.push({ L: avgL, a: avgA, b: avgB });
        }
        
        return centroids;
    }
    
    calculateBIC(colors, clusters, distanceFunction) {
        const n = colors.length;
        const k = clusters.centroids.length;
        
        let totalVariance = 0;
        clusters.centroids.forEach((centroid, index) => {
            const clusterColors = colors.filter((_, i) => clusters.assignments[i] === index);
            clusterColors.forEach(color => {
                const distance = distanceFunction(color, centroid);
                totalVariance += distance * distance;
            });
        });
        
        const bic = n * Math.log(totalVariance / n) + k * Math.log(n);
        return bic;
    }
}

// Median Cut 算法實現
class MedianCutQuantizer {
    constructor(maxColors = 256) {
        this.maxColors = maxColors;
    }
    
    quantize(colors) {
        const colorCounts = this.buildColorHistogram(colors);
        const palette = this.medianCut(colorCounts, this.maxColors);
        return palette.map(color => ColorAnalysisTools.labToRgb(color.L, color.a, color.b));
    }
    
    buildColorHistogram(colors) {
        const histogram = new Map();
        
        colors.forEach(color => {
            const key = `${Math.round(color.L)},${Math.round(color.a)},${Math.round(color.b)}`;
            if (histogram.has(key)) {
                histogram.set(key, histogram.get(key) + 1);
            } else {
                histogram.set(key, 1);
            }
        });
        
        return Array.from(histogram.entries()).map(([key, count]) => {
            const [L, a, b] = key.split(',').map(Number);
            return { color: { L, a, b }, count };
        });
    }
    
    medianCut(colorData, maxColors) {
        if (colorData.length <= 1 || maxColors === 1) {
            return this.getAverageColor(colorData);
        }
        
        if (maxColors === 2) {
            const sorted = this.sortByLargestRange(colorData);
            const mid = Math.floor(colorData.length / 2);
            
            return [
                ...this.medianCut(sorted.slice(0, mid), 1),
                ...this.medianCut(sorted.slice(mid), 1)
            ];
        }
        
        const half = Math.floor(maxColors / 2);
        const sorted = this.sortByLargestRange(colorData);
        const mid = Math.floor(colorData.length / 2);
        
        return [
            ...this.medianCut(sorted.slice(0, mid), half),
            ...this.medianCut(sorted.slice(mid), maxColors - half)
        ];
    }
    
    sortByLargestRange(colorData) {
        const colors = colorData.map(item => item.color);
        
        const lRange = Math.max(...colors.map(c => c.L)) - Math.min(...colors.map(c => c.L));
        const aRange = Math.max(...colors.map(c => c.a)) - Math.min(...colors.map(c => c.a));
        const bRange = Math.max(...colors.map(c => c.b)) - Math.min(...colors.map(c => c.b));
        
        if (lRange >= aRange && lRange >= bRange) {
            return colorData.sort((a, b) => a.color.L - b.color.L);
        } else if (aRange >= bRange) {
            return colorData.sort((a, b) => a.color.a - b.color.a);
        } else {
            return colorData.sort((a, b) => a.color.b - b.color.b);
        }
    }
    
    getAverageColor(colorData) {
        if (colorData.length === 0) return [];
        
        let totalCount = 0;
        let weightedL = 0, weightedA = 0, weightedB = 0;
        
        colorData.forEach(item => {
            const weight = item.count;
            totalCount += weight;
            weightedL += item.color.L * weight;
            weightedA += item.color.a * weight;
            weightedB += item.color.b * weight;
        });
        
        return [{
            L: weightedL / totalCount,
            a: weightedA / totalCount,
            b: weightedB / totalCount
        }];
    }
}

class PixelPicApp {
    constructor() {
        this.currentImage = null;
        this.pixelData = null;
        this.colorPalette = [];
        this.currentStep = 0;
        this.totalSteps = 0;
        this.stitchingPattern = [];
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        // DOM 元素
        this.imageInput = document.getElementById('imageInput');
        this.uploadZone = document.getElementById('uploadZone');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.previewSection = document.getElementById('previewSection');
        this.guideSection = document.getElementById('guideSection');
        this.originalCanvas = document.getElementById('originalCanvas');
        this.pixelCanvas = document.getElementById('pixelCanvas');
        this.guideCanvas = document.getElementById('guideCanvas');
        this.gridWidthSlider = document.getElementById('gridWidth');
        this.gridHeightSlider = document.getElementById('gridHeight');
        this.colorCountSlider = document.getElementById('colorCount');
        this.gridWidthValue = document.getElementById('gridWidthValue');
        this.gridHeightValue = document.getElementById('gridHeightValue');
        this.colorCountValue = document.getElementById('colorCountValue');
        this.keepAspectRatio = document.getElementById('keepAspectRatio');
        this.syncDimensions = document.getElementById('syncDimensions');
        this.analysisMethod = document.getElementById('analysisMethod');
        this.methodDescription = document.getElementById('methodDescription');
        this.autoGridDetection = document.getElementById('autoGridDetection');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.currentColorSample = document.getElementById('currentColorSample');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.currentStepSpan = document.getElementById('currentStep');
        this.totalStepsSpan = document.getElementById('totalSteps');
        this.progressFill = document.getElementById('progressFill');
        this.remainingCount = document.getElementById('remainingCount');
        this.stepInput = document.getElementById('stepInput');
        this.jumpBtn = document.getElementById('jumpBtn');
        this.analysisInfo = document.getElementById('analysisInfo');
    }
    
    bindEvents() {
        // 圖片上傳事件
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.imageInput.click();
        });
        this.uploadZone.addEventListener('click', (e) => {
            // 只有當點擊不是來自按鈕時才觸發
            if (e.target !== this.uploadBtn && !this.uploadBtn.contains(e.target)) {
                this.imageInput.click();
            }
        });
        this.uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadZone.addEventListener('drop', (e) => this.handleDrop(e));
        
        // 滑桿事件
        this.gridWidthSlider.addEventListener('input', () => this.updateGridDimensions('width'));
        this.gridHeightSlider.addEventListener('input', () => this.updateGridDimensions('height'));
        this.colorCountSlider.addEventListener('input', () => this.updateColorCount());
        this.analysisMethod.addEventListener('change', () => this.updateMethodDescription());
        this.syncDimensions.addEventListener('click', () => this.syncGridDimensions());
        
        // 按鈕事件
        this.analyzeBtn.addEventListener('click', () => this.analyzeImage());
        this.prevBtn.addEventListener('click', () => this.previousStep());
        this.nextBtn.addEventListener('click', () => this.nextStep());
        this.jumpBtn.addEventListener('click', () => this.jumpToStep());

        // 為3D按鈕添加觸控動畫支持
        this.addTouchAnimationSupport();
        
        // 步驟輸入事件
        this.stepInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.jumpToStep();
            }
        });
        this.stepInput.addEventListener('input', () => {
            this.validateStepInput();
        });
        
        // 初始化滑桿顯示
        this.updateGridDimensions('both');
        this.updateColorCount();
        this.updateMethodDescription();
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadZone.classList.add('dragover');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        // 只有當真正離開 uploadZone 時才移除樣式
        if (!this.uploadZone.contains(e.relatedTarget)) {
            this.uploadZone.classList.remove('dragover');
        }
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            this.processImageFile(files[0]);
        }
    }
    
    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.processImageFile(file);
        }
        // 重置 input 值，允許重複選擇相同檔案
        e.target.value = '';
    }
    
    processImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = new Image();
            this.currentImage.onload = () => {
                this.displayOriginalImage();
                this.showPreviewSection();
            };
            this.currentImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    displayOriginalImage() {
        const ctx = this.originalCanvas.getContext('2d');
        const maxSize = 300;
        
        // 計算縮放比例
        const scale = Math.min(maxSize / this.currentImage.width, maxSize / this.currentImage.height);
        const width = this.currentImage.width * scale;
        const height = this.currentImage.height * scale;
        
        this.originalCanvas.width = width;
        this.originalCanvas.height = height;
        
        ctx.drawImage(this.currentImage, 0, 0, width, height);
    }
    
    showPreviewSection() {
        this.previewSection.style.display = 'block';
        this.previewSection.classList.add('fade-in');
        this.guideSection.style.display = 'none';
        
        // 重置分析按鈕狀態
        this.analyzeBtn.textContent = '開始分析';
        this.analyzeBtn.disabled = false;
        
        // 自動調整網格尺寸以匹配圖片比例
        this.autoAdjustGridSize();
        
        // 清除任何錯誤狀態
        if (this.analysisInfo) {
            this.analysisInfo.innerHTML = '';
            this.analysisInfo.style.background = 'rgba(34, 139, 34, 0.1)';
            this.analysisInfo.style.borderColor = '#22B14C';
            this.analysisInfo.style.color = '#2d5a2d';
        }
    }
    
    autoAdjustGridSize() {
        if (!this.currentImage) return;
        
        const imageWidth = this.currentImage.width;
        const imageHeight = this.currentImage.height;
        const aspectRatio = imageWidth / imageHeight;
        
        // 目標網格大小（保持在合理範圍內）
        const maxGridSize = 48;
        const minGridSize = 12;
        
        let gridWidth, gridHeight;
        
        if (aspectRatio > 1) {
            // 寬度大於高度（橫向長方形）
            gridWidth = Math.min(maxGridSize, Math.max(minGridSize, Math.round(32 * aspectRatio)));
            gridHeight = Math.min(maxGridSize, Math.max(minGridSize, 32));
        } else {
            // 高度大於或等於寬度（縱向長方形或正方形）
            gridWidth = Math.min(maxGridSize, Math.max(minGridSize, 32));
            gridHeight = Math.min(maxGridSize, Math.max(minGridSize, Math.round(32 / aspectRatio)));
        }
        
        // 更新滑桿值
        this.gridWidthSlider.value = gridWidth;
        this.gridHeightSlider.value = gridHeight;
        this.updateGridDimensions('both');
        
        console.log(`📐 圖片尺寸: ${imageWidth}x${imageHeight}, 比例: ${aspectRatio.toFixed(2)}, 建議網格: ${gridWidth}x${gridHeight}`);
    }
    
    updateGridDimensions(changed = 'both') {
        const width = parseInt(this.gridWidthSlider.value);
        const height = parseInt(this.gridHeightSlider.value);
        
        // 如果保持寬高比例且只改變了一個維度
        if (this.keepAspectRatio.checked && changed !== 'both') {
            if (changed === 'width') {
                this.gridHeightSlider.value = width;
                this.gridHeightValue.textContent = width;
            } else if (changed === 'height') {
                this.gridWidthSlider.value = height;
                this.gridWidthValue.textContent = height;
            }
        }
        
        this.gridWidthValue.textContent = this.gridWidthSlider.value;
        this.gridHeightValue.textContent = this.gridHeightSlider.value;
        
        if (this.currentImage) {
            this.updatePixelPreview();
        }
    }
    
    syncGridDimensions() {
        // 將高度同步到寬度
        this.gridHeightSlider.value = this.gridWidthSlider.value;
        this.updateGridDimensions('both');
    }
    
    updateColorCount() {
        const count = this.colorCountSlider.value;
        this.colorCountValue.textContent = count;
        if (this.currentImage) {
            this.updatePixelPreview();
        }
    }
    
    updatePixelPreview() {
        if (!this.currentImage) return;
        
        const gridWidth = parseInt(this.gridWidthSlider.value);
        const gridHeight = parseInt(this.gridHeightSlider.value);
        const pixelSize = 8; // 每個像素點的顯示大小
        
        this.pixelCanvas.width = gridWidth * pixelSize;
        this.pixelCanvas.height = gridHeight * pixelSize;
        
        const ctx = this.pixelCanvas.getContext('2d');
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // 創建縮小版本
        tempCanvas.width = gridWidth;
        tempCanvas.height = gridHeight;
        tempCtx.drawImage(this.currentImage, 0, 0, gridWidth, gridHeight);
        
        const imageData = tempCtx.getImageData(0, 0, gridWidth, gridHeight);
        const data = imageData.data;
        
        // 繪製像素化預覽
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const index = (y * gridWidth + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }
    }
    
    analyzeImage() {
        if (!this.currentImage) return;
        
        // 如果正在分析中，則不執行
        if (this.analyzeBtn.disabled) return;
        
        this.analyzeBtn.textContent = '分析中...';
        this.analyzeBtn.disabled = true;
        
        // 重置之前的分析結果
        this.pixelData = null;
        this.colorPalette = [];
        this.currentStep = 0;
        this.totalSteps = 0;
        // 清理Canvas緩存
        this.baseCanvasImageData = null;
        this.canvasClickListenerAdded = false;
        this.stitchingPattern = [];
        this.colorBatches = [];
        this.detectedGrid = null;
        
        // 重置錯誤狀態顯示
        if (this.analysisInfo) {
            this.analysisInfo.innerHTML = '🔄 正在分析圖片...';
            this.analysisInfo.style.background = 'rgba(102, 126, 234, 0.1)';
            this.analysisInfo.style.borderColor = '#667eea';
            this.analysisInfo.style.color = '#555';
        }
        
        // 添加超時保護，如果分析時間過長自動重置按鈕
        setTimeout(() => {
            if (this.analyzeBtn.disabled && this.analyzeBtn.textContent === '分析中...') {
                console.warn('分析超時，自動重置按鈕狀態');
                this.analyzeBtn.textContent = '重新分析';
                this.analyzeBtn.disabled = false;
            }
        }, 10000); // 10秒超時
        
        setTimeout(() => {
            try {
                this.performImageAnalysis();
                this.generateStitchingPattern();
                this.showGuideSection();
                
                this.analyzeBtn.textContent = '重新分析';
                this.analyzeBtn.disabled = false;
            } catch (error) {
                console.error('分析過程中發生錯誤:', error);
                
                // 重置按鈕狀態，讓用戶可以重試
                this.analyzeBtn.textContent = '重新分析';
                this.analyzeBtn.disabled = false;
                
                // 只在控制台記錄錯誤，不顯示錯誤提示給用戶
                // 因為大部分情況下分析實際上是成功的
            }
        }, 1000);
    }
    
    performImageAnalysis() {
        const colorCount = parseInt(this.colorCountSlider.value);
        
        // 首先檢測原圖是否已有格子結構
        const originalCanvas = document.createElement('canvas');
        const originalCtx = originalCanvas.getContext('2d');
        originalCanvas.width = this.currentImage.width;
        originalCanvas.height = this.currentImage.height;
        originalCtx.drawImage(this.currentImage, 0, 0);
        
        const originalImageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
        const gridDetection = ColorAnalysisTools.detectGrid(originalImageData, originalCanvas);
        
        let imageData, gridSize;
        
        if (this.autoGridDetection.checked && gridDetection.detected && gridDetection.gridWidth >= 8 && gridDetection.gridHeight >= 8) {
            // 如果檢測到格子，使用原始格子結構
            console.log(`✅ 檢測到 ${gridDetection.gridWidth}x${gridDetection.gridHeight} 格子結構`);
            
            // 直接提取格子顏色
            const cellColors = ColorAnalysisTools.extractCellColors(originalImageData, gridDetection);
            this.useDetectedGrid(cellColors, colorCount, gridDetection);
            return;
        } else {
            // 如果沒有檢測到格子，使用傳統方法
            console.log('❌ 未檢測到格子結構，使用傳統縮放方法');
            const gridWidth = parseInt(this.gridWidthSlider.value);
            const gridHeight = parseInt(this.gridHeightSlider.value);
            
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = gridWidth;
            tempCanvas.height = gridHeight;
            tempCtx.drawImage(this.currentImage, 0, 0, gridWidth, gridHeight);
            
            imageData = tempCtx.getImageData(0, 0, gridWidth, gridHeight);
        }
        
        const data = imageData.data;
        
        // 提取所有顏色並轉換到 CIELAB 色彩空間
        const labColors = [];
        for (let i = 0; i < data.length; i += 4) {
            const rgb = {
                r: data[i],
                g: data[i + 1],
                b: data[i + 2]
            };
            const lab = ColorAnalysisTools.rgbToLab(rgb.r, rgb.g, rgb.b);
            labColors.push(lab);
        }
        
        // 使用先進的聚類算法
        const analysisMethod = this.getSelectedAnalysisMethod();
        this.colorPalette = this.performAdvancedColorAnalysis(labColors, colorCount, analysisMethod);
        
        // 創建量化後的像素數據
        this.pixelData = [];
        const gridWidth = imageData.width;
        const gridHeight = imageData.height;
        
        for (let y = 0; y < gridHeight; y++) {
            const row = [];
            for (let x = 0; x < gridWidth; x++) {
                const index = (y * gridWidth + x) * 4;
                const pixel = {
                    r: data[index],
                    g: data[index + 1],
                    b: data[index + 2]
                };
                
                // 轉換到 LAB 並找到最接近的調色板顏色
                const pixelLab = ColorAnalysisTools.rgbToLab(pixel.r, pixel.g, pixel.b);
                const closestColor = this.findClosestColorLab(pixelLab, this.colorPalette);
                row.push(closestColor);
            }
            this.pixelData.push(row);
        }
    }
    
    useDetectedGrid(cellColors, colorCount, gridInfo) {
        // 將所有格子顏色轉換到 LAB 色彩空間
        const allLabColors = [];
        cellColors.forEach(row => {
            row.forEach(color => {
                const lab = ColorAnalysisTools.rgbToLab(color.r, color.g, color.b);
                allLabColors.push(lab);
            });
        });
        
        // 使用先進的聚類算法分析顏色
        const analysisMethod = this.getSelectedAnalysisMethod();
        this.colorPalette = this.performAdvancedColorAnalysis(allLabColors, colorCount, analysisMethod);
        
        // 將格子顏色映射到調色板
        this.pixelData = [];
        cellColors.forEach(row => {
            const pixelRow = [];
            row.forEach(cellColor => {
                const cellLab = ColorAnalysisTools.rgbToLab(cellColor.r, cellColor.g, cellColor.b);
                const closestColor = this.findClosestColorLab(cellLab, this.colorPalette);
                pixelRow.push(closestColor);
            });
            this.pixelData.push(pixelRow);
        });
        
        // 更新網格大小滑桿以反映檢測到的尺寸
        this.gridWidthSlider.value = gridInfo.gridWidth;
        this.gridHeightSlider.value = gridInfo.gridHeight;
        this.updateGridDimensions('both');
        
        // 儲存格子檢測信息
        this.detectedGrid = gridInfo;
    }
    
    getSelectedAnalysisMethod() {
        return this.analysisMethod.value;
    }
    
    updateMethodDescription() {
        const descriptions = {
            'hyab-xmeans': '使用最新的 HyAB 距離公式和自動聚類，提供最準確的色彩分析。自動選擇最佳顏色數量。',
            'median-cut': '經典的 Median Cut 算法，適合色彩分佈明確的圖片，快速且穩定。',
            'deltae2000': '使用 CIE Delta E 2000 距離，最接近人眼感知的色彩差異計算。'
        };
        
        this.methodDescription.textContent = descriptions[this.analysisMethod.value];
    }
    
    performAdvancedColorAnalysis(labColors, maxColorCount, method) {
        switch (method) {
            case 'hyab-xmeans':
                return this.useXMeansHyAB(labColors, maxColorCount);
            case 'median-cut':
                return this.useMedianCut(labColors, maxColorCount);
            case 'deltae2000':
                return this.useXMeansDeltaE(labColors, maxColorCount);
            default:
                return this.useXMeansHyAB(labColors, maxColorCount);
        }
    }
    
    useXMeansHyAB(labColors, maxColorCount) {
        const xmeans = new XMeansCluster(2, maxColorCount);
        const result = xmeans.cluster(labColors, ColorAnalysisTools.hyabDistance);
        
        console.log(`自動選擇了 ${result.k} 種顏色 (BIC: ${result.bic.toFixed(2)})`);
        
        // 轉換回 RGB 格式並添加索引
        return result.clusters.centroids.map((centroid, index) => {
            const rgb = ColorAnalysisTools.labToRgb(centroid.L, centroid.a, centroid.b);
            return {
                r: rgb.r,
                g: rgb.g,
                b: rgb.b,
                lab: centroid,
                index: index
            };
        });
    }
    
    useMedianCut(labColors, maxColorCount) {
        const medianCut = new MedianCutQuantizer(maxColorCount);
        const rgbPalette = medianCut.quantize(labColors);
        
        return rgbPalette.map((rgb, index) => ({
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            lab: ColorAnalysisTools.rgbToLab(rgb.r, rgb.g, rgb.b),
            index: index
        }));
    }
    
    useXMeansDeltaE(labColors, maxColorCount) {
        const xmeans = new XMeansCluster(2, maxColorCount);
        const result = xmeans.cluster(labColors, ColorAnalysisTools.deltaE2000);
        
        console.log(`使用 Delta E 2000 自動選擇了 ${result.k} 種顏色`);
        
        return result.clusters.centroids.map((centroid, index) => {
            const rgb = ColorAnalysisTools.labToRgb(centroid.L, centroid.a, centroid.b);
            return {
                r: rgb.r,
                g: rgb.g,
                b: rgb.b,
                lab: centroid,
                index: index
            };
        });
    }
    
    findClosestColorLab(pixelLab, palette) {
        let minDistance = Infinity;
        let closestColor = palette[0];
        let closestIndex = 0;
        
        palette.forEach((color, index) => {
            const distance = ColorAnalysisTools.hyabDistance(pixelLab, color.lab);
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = color;
                closestIndex = index;
            }
        });
        
        return { ...closestColor, index: closestIndex };
    }
    
    displayAnalysisInfo() {
        // 確保分析數據完整才顯示信息
        if (!this.colorPalette || this.colorPalette.length === 0) {
            return;
        }
        
        const method = this.getSelectedAnalysisMethod();
        const methodNames = {
            'hyab-xmeans': 'HyAB X-Means',
            'median-cut': 'Median Cut',
            'deltae2000': 'Delta E 2000'
        };
        
        const actualColors = this.colorPalette.length;
        const requestedColors = parseInt(this.colorCountSlider.value);
        
        let infoText = '';
        
        // 顯示格子檢測結果
        if (this.detectedGrid) {
            infoText += `🔍 自動檢測到 ${this.detectedGrid.gridWidth}×${this.detectedGrid.gridHeight} 格子結構<br>`;
            infoText += `📐 格子大小: ${this.detectedGrid.cellWidth}×${this.detectedGrid.cellHeight} 像素<br>`;
        } else if (this.pixelData && this.pixelData.length > 0 && this.pixelData[0]) {
            const gridWidth = this.pixelData[0].length;
            const gridHeight = this.pixelData.length;
            infoText += `🔧 使用手動設定的 ${gridWidth}×${gridHeight} 網格<br>`;
            
            if (gridWidth !== gridHeight) {
                const aspectRatio = (gridWidth / gridHeight).toFixed(2);
                infoText += `📏 長方形比例: ${aspectRatio}:1<br>`;
            }
        }
        
        infoText += `✅ 使用 ${methodNames[method]} 算法分析完成<br>`;
        infoText += `📊 實際使用 ${actualColors} 種顏色`;
        
        if (method === 'hyab-xmeans' && actualColors !== requestedColors) {
            infoText += ` (自動優化，原設定 ${requestedColors} 種)`;
        }
        
        // 確保 analysisInfo 元素存在才設置樣式
        if (this.analysisInfo) {
            // 重置錯誤狀態的樣式
            this.analysisInfo.style.background = 'rgba(34, 139, 34, 0.1)';
            this.analysisInfo.style.borderColor = '#22B14C';
            this.analysisInfo.style.color = '#2d5a2d';
            this.analysisInfo.innerHTML = infoText;
        }
    }
    
    kMeansColors(colors, k) {
        // 處理特殊情況
        if (k <= 0) k = 2;
        if (k >= colors.length) {
            // 如果要求的顏色數超過實際顏色數，返回所有唯一顏色
            const uniqueColors = [];
            const colorMap = new Map();
            
            colors.forEach(color => {
                const key = `${color.r},${color.g},${color.b}`;
                if (!colorMap.has(key)) {
                    colorMap.set(key, color);
                    uniqueColors.push({ ...color });
                }
            });
            
            return uniqueColors;
        }
        
        // 簡化的 K-means 實現
        let centroids = [];
        
        // 更好的初始化：使用 K-means++ 方法
        centroids.push({ ...colors[Math.floor(Math.random() * colors.length)] });
        
        for (let i = 1; i < k; i++) {
            const distances = colors.map(color => {
                let minDist = Infinity;
                centroids.forEach(centroid => {
                    const dist = this.colorDistance(color, centroid);
                    if (dist < minDist) minDist = dist;
                });
                return minDist * minDist;
            });
            
            const totalDist = distances.reduce((sum, d) => sum + d, 0);
            let random = Math.random() * totalDist;
            
            for (let j = 0; j < colors.length; j++) {
                random -= distances[j];
                if (random <= 0) {
                    centroids.push({ ...colors[j] });
                    break;
                }
            }
        }
        
        // 迭代優化
        for (let iter = 0; iter < 20; iter++) {
            const clusters = Array(k).fill(null).map(() => []);
            
            // 分配顏色到最近的中心點
            colors.forEach(color => {
                let minDistance = Infinity;
                let clusterIndex = 0;
                
                centroids.forEach((centroid, index) => {
                    const distance = this.colorDistance(color, centroid);
                    if (distance < minDistance) {
                        minDistance = distance;
                        clusterIndex = index;
                    }
                });
                
                clusters[clusterIndex].push(color);
            });
            
            // 更新中心點
            let changed = false;
            const newCentroids = clusters.map((cluster, index) => {
                if (cluster.length === 0) return centroids[index];
                
                const avgR = cluster.reduce((sum, c) => sum + c.r, 0) / cluster.length;
                const avgG = cluster.reduce((sum, c) => sum + c.g, 0) / cluster.length;
                const avgB = cluster.reduce((sum, c) => sum + c.b, 0) / cluster.length;
                
                const newCentroid = {
                    r: Math.round(avgR),
                    g: Math.round(avgG),
                    b: Math.round(avgB)
                };
                
                if (this.colorDistance(newCentroid, centroids[index]) > 1) {
                    changed = true;
                }
                
                return newCentroid;
            });
            
            centroids = newCentroids;
            
            // 如果中心點不再變化，提前結束
            if (!changed) break;
        }
        
        return centroids;
    }
    
    colorDistance(color1, color2) {
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }
    
    findClosestColor(pixel, palette) {
        let minDistance = Infinity;
        let closestColor = palette[0];
        let closestIndex = 0;
        
        palette.forEach((color, index) => {
            const distance = this.colorDistance(pixel, color);
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = color;
                closestIndex = index;
            }
        });
        
        return { ...closestColor, index: closestIndex };
    }
    
    generateStitchingPattern() {
        // 按照連續位置順序生成編織模式
        this.stitchingPattern = this.createSequentialPattern();
        this.colorBatches = this.calculateColorBatches();
        
        this.totalSteps = this.stitchingPattern.length;
        this.currentStep = 0;
    }
    
    createSequentialPattern() {
        // 蛇形編織順序（之字形）- 從右下角開始
        const pattern = [];
        const rows = this.pixelData.length;
        const cols = this.pixelData[0].length;
        
        // 從最後一行開始，往上編織
        for (let y = rows - 1; y >= 0; y--) {
            const rowIndex = rows - 1 - y; // 計算是第幾行（從下往上）
            
            if (rowIndex % 2 === 0) {
                // 第一行（最下面）和奇數行：從右到左
                for (let x = cols - 1; x >= 0; x--) {
                    pattern.push({
                        x: x,
                        y: y,
                        color: this.pixelData[y][x],
                        step: pattern.length + 1
                    });
                }
            } else {
                // 偶數行：從左到右
                for (let x = 0; x < cols; x++) {
                    pattern.push({
                        x: x,
                        y: y,
                        color: this.pixelData[y][x],
                        step: pattern.length + 1
                    });
                }
            }
        }
        
        return pattern;
    }
    
    calculateColorBatches() {
        // 計算每個顏色批次的信息
        const batches = [];
        let currentColor = null;
        let currentBatch = null;
        
        this.stitchingPattern.forEach((step, index) => {
            const colorKey = `${step.color.r},${step.color.g},${step.color.b}`;
            
            if (colorKey !== currentColor) {
                // 開始新的顏色批次
                if (currentBatch) {
                    batches.push(currentBatch);
                }
                
                currentColor = colorKey;
                currentBatch = {
                    color: step.color,
                    startStep: index,
                    endStep: index,
                    count: 1,
                    steps: [step]
                };
            } else {
                // 繼續當前顏色批次
                currentBatch.endStep = index;
                currentBatch.count++;
                currentBatch.steps.push(step);
            }
        });
        
        if (currentBatch) {
            batches.push(currentBatch);
        }
        
        return batches;
    }
    
    showGuideSection() {
        this.guideSection.style.display = 'block';
        this.guideSection.classList.add('fade-in');
        
        this.setupGuideCanvas();
        this.displayAnalysisInfo();


        this.updateStepDisplay();
        this.highlightCurrentStep();
        this.updateColorBatchInfo();
        this.initializeStepInput();
    }
    
    setupGuideCanvas() {
        const cellSize = 20;
        const gridWidth = this.pixelData[0].length;
        const gridHeight = this.pixelData.length;
        
        this.guideCanvas.width = gridWidth * cellSize;
        this.guideCanvas.height = gridHeight * cellSize;
        
        // 只繪製一次基礎圖案，並緩存
        if (!this.baseCanvasImageData) {
            this.drawBaseCanvas();
        } else {
            // 使用緩存的圖案數據
            const ctx = this.guideCanvas.getContext('2d');
            ctx.putImageData(this.baseCanvasImageData, 0, 0);
        }
        
        // 添加點擊事件監聽器（只添加一次）
        if (!this.canvasClickListenerAdded) {
            this.guideCanvas.addEventListener('click', (e) => this.handleCanvasClick(e));
            this.canvasClickListenerAdded = true;
        }
    }
    
    drawBaseCanvas() {
        const cellSize = 20;
        const gridWidth = this.pixelData[0].length;
        const gridHeight = this.pixelData.length;
        const ctx = this.guideCanvas.getContext('2d');
        
        // 批量繪製以提高性能
        ctx.imageSmoothingEnabled = false; // 禁用抗鋸齒以提高性能
        
        // 繪製完整圖案
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const color = this.pixelData[y][x];
                ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
        
        // 一次性繪製所有網格線
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        // 垂直線
        for (let x = 0; x <= gridWidth; x++) {
            ctx.moveTo(x * cellSize, 0);
            ctx.lineTo(x * cellSize, gridHeight * cellSize);
        }
        
        // 水平線  
        for (let y = 0; y <= gridHeight; y++) {
            ctx.moveTo(0, y * cellSize);
            ctx.lineTo(gridWidth * cellSize, y * cellSize);
        }
        
        ctx.stroke();
        
        // 緩存基礎圖案
        this.baseCanvasImageData = ctx.getImageData(0, 0, this.guideCanvas.width, this.guideCanvas.height);
    }
    
    handleCanvasClick(e) {
        const rect = this.guideCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const cellSize = 20;
        const gridX = Math.floor(x / cellSize);
        const gridY = Math.floor(y / cellSize);
        
        // 找到對應的步驟
        const targetStep = this.stitchingPattern.find(step => 
            step.x === gridX && step.y === gridY
        );
        
        if (targetStep) {
            this.currentStep = targetStep.step - 1;
            this.updateStepDisplay();
            this.highlightCurrentStep();

            this.updateStepInput();
        }
    }
    

    

    
    highlightCurrentStep() {
        if (this.currentStep >= this.stitchingPattern.length) return;

        const step = this.stitchingPattern[this.currentStep];

        // 使用節流來減少Canvas重繪頻率
        if (this.highlightThrottle) {
            clearTimeout(this.highlightThrottle);
        }

        this.highlightThrottle = setTimeout(() => {
            const cellSize = 20;
            const ctx = this.guideCanvas.getContext('2d');

            // 恢復基礎圖案（高效）
            if (this.baseCanvasImageData) {
                ctx.putImageData(this.baseCanvasImageData, 0, 0);
            } else {
                this.setupGuideCanvas();
            }

            // 只繪製高亮框
            this.drawHighlight(step.x, step.y, cellSize, ctx);
        }, 16); // 約60fps

        // 立即更新顏色顯示（不需要節流）
        const color = step.color;
        this.currentColorSample.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;

        // 更新顏色批次信息
        this.updateColorBatchInfo();
    }
    
    drawHighlight(x, y, cellSize, ctx) {
        // 簡化高亮繪製以節省GPU
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
    }
    
    // 移除性能監控以節省開銷
    
    getCurrentColorBatch() {
        // 找到當前步驟所屬的顏色批次
        for (let batch of this.colorBatches) {
            if (this.currentStep >= batch.startStep && this.currentStep <= batch.endStep) {
                return batch;
            }
        }
        return null;
    }
    
    updateColorBatchInfo() {
        // 安全檢查
        if (!this.remainingCount || !this.stitchingPattern || this.stitchingPattern.length === 0) {
            if (this.remainingCount) {
                this.remainingCount.textContent = '載入中...';
            }
            return;
        }

        const currentStep = this.stitchingPattern[this.currentStep];
        if (!currentStep) {
            this.remainingCount.textContent = '計算中...';
            return;
        }

        // 計算相同顏色還有多少步
        const currentColor = currentStep.color;
        let remainingSteps = 0;

        // 從當前步驟開始向後計算相同顏色的步數
        for (let i = this.currentStep + 1; i < this.totalSteps; i++) {
            const futureColor = this.stitchingPattern[i].color;
            if (currentColor.r === futureColor.r &&
                currentColor.g === futureColor.g &&
                currentColor.b === futureColor.b) {
                remainingSteps++;
            } else {
                break; // 遇到不同顏色就停止
            }
        }

        // 顯示結果
        if (remainingSteps > 0) {
            this.remainingCount.textContent = `此顏色還有 ${remainingSteps} 步`;
            this.remainingCount.style.background = 'rgba(255, 255, 255, 0.15)';
            this.remainingCount.style.color = '#333';
        } else {
            // 檢查下一步是否會換色
            const nextStep = this.currentStep + 1;
            if (nextStep < this.totalSteps) {
                this.remainingCount.textContent = `下一步將換色`;
                this.remainingCount.style.background = 'rgba(255, 243, 205, 0.15)';
                this.remainingCount.style.color = '#856404';
            } else {
                this.remainingCount.textContent = `最後一步`;
                this.remainingCount.style.background = 'rgba(232, 245, 232, 0.15)';
                this.remainingCount.style.color = '#2d5a2d';
            }
        }
    }
    
    updateStepDisplay() {
        this.currentStepSpan.textContent = `第 ${this.currentStep + 1} 步`;
        this.totalStepsSpan.textContent = `共 ${this.totalSteps} 步`;
        
        const progress = (this.currentStep / this.totalSteps) * 100;
        this.progressFill.style.width = `${progress}%`;
        
        this.prevBtn.disabled = this.currentStep === 0;
        this.nextBtn.disabled = this.currentStep >= this.totalSteps - 1;
    }
    
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStepDisplay();
            this.highlightCurrentStep();

            this.updateStepInput();
        }
    }
    
    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            this.currentStep++;
            this.updateStepDisplay();
            this.highlightCurrentStep();

            this.updateStepInput();
        }
    }
    
    // resetGuide 方法已删除，因为重置按钮已移除
    
    initializeStepInput() {
        this.stepInput.max = this.totalSteps;
        this.stepInput.value = this.currentStep + 1;
    }
    
    updateStepInput() {
        this.stepInput.value = this.currentStep + 1;
    }
    
    validateStepInput() {
        const value = parseInt(this.stepInput.value);
        const max = parseInt(this.stepInput.max);
        
        if (value < 1) {
            this.stepInput.value = 1;
        } else if (value > max) {
            this.stepInput.value = max;
        }
    }
    
    jumpToStep() {
        const targetStep = parseInt(this.stepInput.value);
        
        if (targetStep >= 1 && targetStep <= this.totalSteps) {
            this.currentStep = targetStep - 1;
            this.updateStepDisplay();
            this.highlightCurrentStep();

        } else {
            alert(`請輸入 1 到 ${this.totalSteps} 之間的步驟號碼`);
            this.updateStepInput();
        }
    }

    // 為3D按鈕添加觸控動畫支持
    addTouchAnimationSupport() {
        const btn3dElements = document.querySelectorAll('.btn-3d');

        btn3dElements.forEach(button => {
            // 觸控開始事件
            button.addEventListener('touchstart', (e) => {
                // 不阻止默認行為，保持原有功能
                const front = button.querySelector('.front');
                if (front) {
                    front.style.transform = 'translateY(0%)';
                    front.style.webkitTransform = 'translateY(0%)';
                    front.style.boxShadow = '0 0';
                }
            });

            // 觸控結束事件
            button.addEventListener('touchend', (e) => {
                // 不阻止默認行為，保持原有功能
                const front = button.querySelector('.front');
                if (front) {
                    front.style.transform = 'translateY(-15%)';
                    front.style.webkitTransform = 'translateY(-15%)';
                    front.style.boxShadow = '0 .5em 1em -0.2em rgba(0,0,0,.3)';
                }

                // 觸發粒子效果
                this.createParticleEffect(button);
            });

            // 觸控取消事件（手指移出按鈕區域）
            button.addEventListener('touchcancel', (e) => {
                const front = button.querySelector('.front');
                if (front) {
                    front.style.transform = 'translateY(-15%)';
                    front.style.webkitTransform = 'translateY(-15%)';
                    front.style.boxShadow = '0 .5em 1em -0.2em rgba(0,0,0,.3)';
                }
            });

            // 鼠標事件（桌面支持）
            button.addEventListener('mousedown', (e) => {
                const front = button.querySelector('.front');
                if (front) {
                    front.style.transform = 'translateY(0%)';
                    front.style.webkitTransform = 'translateY(0%)';
                    front.style.boxShadow = '0 0';
                }
            });

            button.addEventListener('mouseup', (e) => {
                const front = button.querySelector('.front');
                if (front) {
                    front.style.transform = 'translateY(-15%)';
                    front.style.webkitTransform = 'translateY(-15%)';
                    front.style.boxShadow = '0 .5em 1em -0.2em rgba(0,0,0,.3)';
                }

                // 觸發粒子效果
                this.createParticleEffect(button);
            });

            button.addEventListener('mouseleave', (e) => {
                const front = button.querySelector('.front');
                if (front) {
                    front.style.transform = 'translateY(-15%)';
                    front.style.webkitTransform = 'translateY(-15%)';
                    front.style.boxShadow = '0 .5em 1em -0.2em rgba(0,0,0,.3)';
                }
            });
        });
    }

    // 創建粒子效果
    createParticleEffect(button) {
        const buttonRect = button.getBoundingClientRect();
        const centerX = buttonRect.left + buttonRect.width / 2;
        const centerY = buttonRect.top + buttonRect.height / 2;

        // 創建多個粒子
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            // 設置粒子初始位置
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';

            // 計算隨機方向和距離
            const angle = (360 / particleCount) * i + Math.random() * 45 - 22.5;
            const distance = 80 + Math.random() * 40;
            const radians = angle * Math.PI / 180;

            const dx = Math.cos(radians) * distance;
            const dy = Math.sin(radians) * distance;

            // 添加到頁面
            document.body.appendChild(particle);

            // 設置動畫變量
            particle.style.setProperty('--dx', dx + 'px');
            particle.style.setProperty('--dy', dy + 'px');

            // 使用CSS動畫
            particle.classList.add('animate');

            // 動畫結束後移除粒子
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 1500);
        }
    }
}

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    new PixelPicApp();
}); 