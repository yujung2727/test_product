 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/main.js b/main.js
index f4a709fd886903e634d69637ef83a356e1e9b0a8..a9624ed670b9667db9f2d8e96324c28047bea7e9 100644
--- a/main.js
+++ b/main.js
@@ -1,71 +1,100 @@
-const imageUpload = document.getElementById('imageUpload');
-const predictButton = document.getElementById('predict-button');
-const resultDiv = document.getElementById('result');
-const imagePreview = document.getElementById('image-preview');
+const MODEL_URL = "https://teachablemachine.withgoogle.com/models/zcHwJaCPA/";
+
+const imageUpload = document.getElementById("image-upload");
+const predictButton = document.getElementById("predict-button");
+const statusEl = document.getElementById("status");
+const previewWrapper = document.getElementById("preview-wrapper");
+const previewImage = document.getElementById("preview-image");
+const topResultEl = document.getElementById("top-result");
+const labelContainer = document.getElementById("label-container");
 
 let model;
+let maxPredictions = 0;
 
 async function loadModel() {
-    try {
-        model = await mobilenet.load();
-        predictButton.disabled = false;
-        predictButton.textContent = 'Analyze';
-    } catch (error) {
-        console.error('Error loading model:', error);
-        resultDiv.textContent = 'Could not load model. Please try again later.';
+  try {
+    const modelURL = `${MODEL_URL}model.json`;
+    const metadataURL = `${MODEL_URL}metadata.json`;
+
+    model = await tmImage.load(modelURL, metadataURL);
+    maxPredictions = model.getTotalClasses();
+
+    labelContainer.replaceChildren();
+    for (let i = 0; i < maxPredictions; i += 1) {
+      const row = document.createElement("div");
+      row.className = "label-row";
+      labelContainer.appendChild(row);
     }
+
+    statusEl.textContent = "사진을 업로드하고 분석하기를 눌러주세요.";
+    predictButton.disabled = false;
+  } catch (error) {
+    console.error(error);
+    statusEl.textContent = "모델 로딩에 실패했어요. 잠시 후 다시 시도해주세요.";
+  }
 }
 
-predictButton.addEventListener('click', async () => {
-    if (!imageUpload.files || imageUpload.files.length === 0) {
-        resultDiv.textContent = 'Please select an image first.';
-        return;
-    }
+function renderPredictions(predictions) {
+  predictions.sort((a, b) => b.probability - a.probability);
 
-    const image = imagePreview;
-    
-    try {
-        const predictions = await model.classify(image);
-        console.log('Predictions:', predictions);
-
-        // Filter for animal predictions
-        const animalPredictions = predictions.filter(pred => {
-            const animalLabels = ['cat', 'dog', 'bird', 'lion', 'tiger', 'bear', 'fox', 'wolf', 'rabbit', 'hamster', 'squirrel', 'deer', 'koala', 'panda'];
-            return animalLabels.some(label => pred.className.includes(label));
-        });
-
-        if (animalPredictions.length > 0) {
-            const topPrediction = animalPredictions[0];
-            const animal = topPrediction.className.split(',')[0];
-            const probability = (topPrediction.probability * 100).toFixed(2);
-            resultDiv.innerHTML = `<p>You look like a ${animal} with ${probability}% certainty.</p>`;
-        } else {
-            resultDiv.textContent = 'Could not determine an animal resemblance. Try a different image.';
-        }
-
-    } catch (error) {
-        console.error('Error during prediction:', error);
-        resultDiv.textContent = 'An error occurred during analysis. Please try again.';
-    }
-});
+  predictions.forEach((prediction, idx) => {
+    const probability = (prediction.probability * 100).toFixed(1);
+    labelContainer.childNodes[idx].innerHTML = `<span>${prediction.className}</span><strong>${probability}%</strong>`;
+  });
 
-imageUpload.addEventListener('change', (event) => {
-    const file = event.target.files[0];
-    if (file) {
-        const reader = new FileReader();
-        reader.onload = (e) => {
-            imagePreview.src = e.target.result;
-            imagePreview.style.display = 'block';
-            resultDiv.textContent = 'Image loaded. Click \'Analyze\' to see the result.';
-        };
-        reader.readAsDataURL(file);
-    } else {
-        imagePreview.style.display = 'none';
-        resultDiv.textContent = 'Please upload an image.';
-    }
+  const top = predictions[0];
+  if (top) {
+    const topPercent = (top.probability * 100).toFixed(1);
+    topResultEl.textContent = `결과: ${top.className} (${topPercent}%)`;
+  }
+}
+
+async function predictFromImage() {
+  if (!model) {
+    statusEl.textContent = "모델이 아직 준비되지 않았어요.";
+    return;
+  }
+
+  if (!previewImage.src) {
+    statusEl.textContent = "먼저 사진을 업로드해주세요.";
+    return;
+  }
+
+  try {
+    predictButton.disabled = true;
+    statusEl.textContent = "분석 중입니다...";
+    const predictions = await model.predict(previewImage);
+    renderPredictions(predictions);
+    statusEl.textContent = "분석이 완료됐어요.";
+  } catch (error) {
+    console.error(error);
+    statusEl.textContent = "이미지 분석 중 오류가 발생했어요. 다른 사진으로 시도해주세요.";
+  } finally {
+    predictButton.disabled = false;
+  }
+}
+
+imageUpload.addEventListener("change", () => {
+  const [file] = imageUpload.files || [];
+
+  if (!file) {
+    previewImage.src = "";
+    previewWrapper.classList.add("hidden");
+    topResultEl.textContent = "";
+    statusEl.textContent = "사진을 업로드하고 분석하기를 눌러주세요.";
+    return;
+  }
+
+  const objectUrl = window.URL.createObjectURL(file);
+  previewImage.onload = () => {
+    window.URL.revokeObjectURL(objectUrl);
+  };
+  previewImage.src = objectUrl;
+  previewWrapper.classList.remove("hidden");
+  topResultEl.textContent = "";
+  statusEl.textContent = "사진이 업로드됐어요. 분석하기를 눌러주세요.";
 });
 
-// Initial setup
-predictButton.disabled = true;
-predictButton.textContent = 'Loading Model...';
-loadModel();
\ No newline at end of file
+predictButton.addEventListener("click", predictFromImage);
+
+loadModel();
 
EOF
)
