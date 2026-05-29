window.OSApps = window.OSApps || [];

window.OSApps.push({
id:"cameraApp",
name:"Camera",
icon:"https://www.shutterstock.com/image-vector/camera-icon-isolated-on-white-260nw-335580395.jpg",

render(){
return `
<div class="origin-header liquid">
<button class="backBtn liquid" onclick="closeCurrentApp()">←</button>
<h2>Camera</h2>
</div>

<div class="app-content camera-app">

<div class="camera-card liquid">

<div class="camera-viewfinder">
<video id="cameraPreview" autoplay playsinline muted></video>

<div id="cameraPermissionText" class="camera-permission-text">
Allow camera access to use WannUI Camera.
</div>
</div>

<div class="camera-actions">
<button
id="cameraSwitchBtn"
class="camera-switch-btn"
onclick="switchWannCamera()">
⇄
</button>

<button class="camera-shutter" onclick="captureWannPhoto()">
</button>

<button onclick="stopWannCamera()">■</button>
</div>

<div class="camera-preview-result" id="cameraResultBox" style="display:none;">

<img id="capturedPhotoPreview">

<h3>Save?</h3>

<div class="camera-save-actions">
<button onclick="saveCapturedPhoto()">Save</button>
<button onclick="retakeWannPhoto()">Retake</button>
</div>

</div>

<canvas id="cameraCanvas" style="display:none;"></canvas>

</div>

</div>
`;
},

init(){
setTimeout(()=>{
startWannCamera();
},120);
}
});