const imageUpload = document.getElementById('imageUpload');
const predictButton = document.getElementById('predict-button');
const resultDiv = document.getElementById('result');
const imagePreview = document.getElementById('image-preview');

let model;

async function loadModel() {
    try {
        model = await mobilenet.load();
        predictButton.disabled = false;
        predictButton.textContent = 'Analyze';
    } catch (error) {
        console.error('Error loading model:', error);
        resultDiv.textContent = 'Could not load model. Please try again later.';
    }
}

predictButton.addEventListener('click', async () => {
    if (!imageUpload.files || imageUpload.files.length === 0) {
        resultDiv.textContent = 'Please select an image first.';
        return;
    }

    const image = imagePreview;
    
    try {
        const predictions = await model.classify(image);
        console.log('Predictions:', predictions);

        // Filter for animal predictions
        const animalPredictions = predictions.filter(pred => {
            const animalLabels = ['cat', 'dog', 'bird', 'lion', 'tiger', 'bear', 'fox', 'wolf', 'rabbit', 'hamster', 'squirrel', 'deer', 'koala', 'panda'];
            return animalLabels.some(label => pred.className.includes(label));
        });

        if (animalPredictions.length > 0) {
            const topPrediction = animalPredictions[0];
            const animal = topPrediction.className.split(',')[0];
            const probability = (topPrediction.probability * 100).toFixed(2);
            resultDiv.innerHTML = `<p>You look like a ${animal} with ${probability}% certainty.</p>`;
        } else {
            resultDiv.textContent = 'Could not determine an animal resemblance. Try a different image.';
        }

    } catch (error) {
        console.error('Error during prediction:', error);
        resultDiv.textContent = 'An error occurred during analysis. Please try again.';
    }
});

imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            resultDiv.textContent = 'Image loaded. Click \'Analyze\' to see the result.';
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.style.display = 'none';
        resultDiv.textContent = 'Please upload an image.';
    }
});

// Initial setup
predictButton.disabled = true;
predictButton.textContent = 'Loading Model...';
loadModel();