import styles from './styles.module.scss'
import env from '@/common/env'
import Button from '@/components/ui/button/Button'
import { Link } from '@nerimity/solid-router'
import PageHeader from '../../components/PageHeader'
export default function HomePage () {
  return (
    <div class={styles.homePage}>
      <PageHeader />
      <Body/>

      <img class={styles.homePageArt} src="./assets/home-page-art.svg" alt=""/>
    </div>
  )
}


function Body () {
  return (
    <div class={styles.body}>
      <TopArea/>
    </div>
  )
}

function TopArea () {
  return (
    <div class={styles.topArea}>
      <DetailsPane/>
    </div>
  )
}


function DetailsPane() {
  return (
    <div class={styles.detailsPane}>
      <div class={styles.title}>{env.APP_NAME}</div>
      <div class={styles.slogan}>A modern and sleek chat app.</div>
      <div class={styles.buttons}>
        <Link href='/register' ><Button iconName='open_in_browser' label='Join Nerimity' primary={true} /></Link>
        <a href="https://github.com/Nerimity/nerimity-web" target="_blank" rel="noopener noreferrer"><Button color='white' iconName='code' label='View GitHub'  /></a>
      </div>
    </div>
  )
}