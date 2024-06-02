// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// always-run-in-app: true; icon-color: cyan;
// icon-glyph: image;
const getInfo = async (illustID) => {
	const req = new Request(`https://www.pixiv.net/ajax/illust/${illustID}?lang=en`)
	req.headers['X-Reqested-With'] = 'XMLHttpReqeust'
	
	const res = await req.loadJSON()
	if (res.error) throw new Error(res.message)
	
	return res.body
}

const getImgURLs = (info) => {
	const urls = []
	
	for (let i=0; i < info.pageCount; i++) {
		urls.push(info.urls.original.replace('p0.', 'p' + i + '.'))
	}
	
	return urls
}

const dlImage = (url) => new Promise(async done => {
	let dataURL = ''
	
	const wv = new WebView()
	wv.shouldAllowRequest = (req) => {console.log(req.url)
		if (req.url === 'https://done.rc14.local/') {
			wv.loadHTML('')
			done(dataURL)
			return false
		}
		if (!req.url.startsWith('https://data.rc14.local/?')) return true
		
		dataURL += req.url.substring('https://data.rc14.local/?'.length)
		
		return false
	}
	wv.loadHTML(
		`<html><head><script type="module">
			const chunkSize = 10000
			const magicNum = 1 / chunkSize
			
			const sendReq = (type, data=null) => {
				const url = 'https://'+type+'.rc14.local/' + (data ? '?' + data : '')
				const e = document.createElement('iframe')
				e.src = url
				document.body.append(e)
			}
			
			const reader = new FileReader()
			let done = null
			reader.onloadend = () => void done(reader.result)
			
			const url = \`${url}\`
			const blob = await fetch(url).then(r=>r.blob())
			const b64 = await new Promise((resolve) => {
				done = resolve
				reader.readAsDataURL(blob)
			})
			
			const n = Math.ceil(b64.length * magicNum)
			sendReq('len',n)
			for (let i=0, o=0; i<n; i++, o+=chunkSize) {
				sendReq('data', b64.substring(o, o+chunkSize))
			}
			
			sendReq('done')
		</script></head><body></body></html>`,
		'https://' + url.split('/')[2] + '/'
	)
})

const dataURL = await dlImage(getImgURLs(await getInfo(85059645))[0])

const b64 = dataURL.split(';base64,')[1]
const data = Data.fromBase64String(b64)
const img = Image.fromData(data)

QuickLook.present(img, true)