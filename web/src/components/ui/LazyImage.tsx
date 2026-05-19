import type { ImgHTMLAttributes } from 'react'

export function LazyImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const { loading = 'lazy', decoding = 'async', ...rest } = props
  return <img loading={loading} decoding={decoding} {...rest} />
}
