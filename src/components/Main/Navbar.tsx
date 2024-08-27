import { useContext } from 'react'
import styled from 'styled-components'
import {
} from '../../utils'
import { MainContext } from '../MainProvider'
import SettingsIcon from 'remixicon-react/Settings2FillIcon'
import ConfigIcon from 'remixicon-react/PencilFillIcon'
import { SidebarContext } from '../SidebarProvider'
import { useTranslation } from 'react-i18next'

const IconContainer = styled.div`
  padding: 8px;
  margin-left: 12px;
  width: 2em;
  height: 2em;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background-color: white;
  float: right;
  cursor: pointer;
`

const Navbar = () => {
    const {
        setCurrentScreen,
    } = useContext(MainContext)
    const { setIsOpen } = useContext(SidebarContext)
    const { t } = useTranslation()

    return (
        <>
            <nav className="border-gray-200 dark:bg-gray-900">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <a onClick={() => setCurrentScreen && setCurrentScreen('practice')} className="flex items-center space-x-3 rtl:space-x-reverse">
                        <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white"><h2 className='logo text-red-500'>{t('pages.home.title')}</h2></span>
                    </a>
                    <button data-collapse-toggle="navbar-default" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-default" aria-expanded="false">
                        <span className="sr-only">Open main menu</span>
                        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h15M1 7h15M1 13h15" />
                        </svg>
                    </button>
                    <div className="hidden w-full md:block md:w-auto" id="navbar-default">
                        <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
                            <li>
                                <IconContainer
                                    title={t('pages.practice.mode.configModeHint')}
                                    onClick={() => setCurrentScreen?.('config')}
                                >
                                    <ConfigIcon color='#1f1f20' />
                                </IconContainer>
                            </li>
                            <li>
                                <IconContainer
                                    title={t('pages.practice.mode.settingsHint')}
                                    onClick={() => setIsOpen?.(true)}
                                >
                                    <SettingsIcon color='#1f1f20' />
                                </IconContainer>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </>
    )
}

export default Navbar
