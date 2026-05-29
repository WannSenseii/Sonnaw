window.OSApps = window.OSApps || [];

window.OSApps.push({
id:"tiktokApp",
name:"TikTok",
icon:"https://img.magnific.com/premium-vector/tik-tok-logo_578229-290.jpg?semt=ais_hybrid&w=740&q=80",

render(){
return `
<div class="origin-header liquid">
<button class="backBtn liquid" onclick="closeCurrentApp()">←</button>
<h2>TikTok</h2>

<button class="tiktok-refresh-btn liquid" onclick="refreshWannTikTok()">
⟳
</button>
</div>

<div class="tiktok-browser-app">

<div class="tiktok-urlbar liquid">
<input id="tiktokUrlInput" value="https://www.tiktok.com/" placeholder="TikTok URL">
<button onclick="loadWannTikTokUrl()">Go</button>
</div>

<div class="tiktok-frame-wrap">
<iframe
id="tiktokFrame"
src="https://www.tiktok.com/"
allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
referrerpolicy="strict-origin-when-cross-origin">
</iframe>

<div id="tiktokBlockedHint" class="tiktok-blocked-hint">
<h2>TikTok</h2>
<p>
If this stays blank, TikTok blocked iframe loading. Use the open button below.
</p>
<button onclick="openWannTikTokExternal()">Open TikTok</button>
</div>
</div>

</div>
`;
},

init(){
setTimeout(()=>{
checkWannTikTokFrame();
},1400);
}
});