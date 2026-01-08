export const handleQR = async (ctx: any, next: any) => {
  const userAgent = ctx.request.headers['user-agent'] || ''

  if (ctx.path === '/getapp') {
    if (/android/i.test(userAgent)) {
      ctx.redirect('https://play.google.com/store/apps/details?id=com.davaindia')
    } else if (/ipad|iphone/i.test(userAgent)) {
      ctx.redirect('https://apps.apple.com/in/app/davaindia-generic-pharmacy/id6741474883')
    } else {
      ctx.redirect('https://www.davaindia.com/')
    }
  } else {
    await next()
  }
}
