import type { DetailedHTMLProps, HTMLAttributes } from "react"

/**
 * 스켈레톤 글자 마디 태그 <sk-t>
 *
 * 컴포넌트 CSS 가 잡지 않는 태그라 실제 화면에서는 글자를 감싸기만 하고,
 * .is-sk 안에서만 글자 폭만큼의 막대로 바뀐다. (app/globals.css)
 */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "sk-t": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}
