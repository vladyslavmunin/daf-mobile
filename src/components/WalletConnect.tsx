import React, { useEffect } from 'react'
import { agent } from '../services/daf'
import { wcEventHub } from '../providers/WalletConnect'
import { Screens } from '../navigators/screens'
import AppConstants from '../constants/index'

interface WalletConnectProps {
  navigate: (routeName: any, params: any) => void
}

/**
 * Top level component to house all the event handlers coming from wallet connect provider
 **/
const WalletConnect: React.FC<WalletConnectProps> = ({ navigate }) => {
  useEffect(() => {
    wcEventHub.addListener(
      AppConstants.events.WALLET_CONNECT.SESSION_REQUEST_INT,
      async ({ peerId, peerMeta, payload }: any) => {
        const requestType = AppConstants.requests.SESSION

        navigate(Screens.Requests.screen, {
          requestType,
          peerId,
          peerMeta,
          payload,
        })
      },
    )

    wcEventHub.addListener(
      AppConstants.events.WALLET_CONNECT.CALL_REQUEST_INT,
      async ({ peerId, peerMeta, payload }) => {
        const message = payload.params[0]
          ? await agent.handleMessage({
              raw: payload.params[0].proof.jwt,
              metaData: [{ type: 'walletConnect' }],
              save: false,
            })
          : null

        if (message && payload.method === 'issue_credential') {
          if (message.raw) {
            await agent.handleMessage({ raw: message.raw, save: true })
          }
        }

        if (message && payload.method === 'request_credentials') {
          if (message.raw) {
            await agent.handleMessage({ raw: message.raw, save: true })
          }
          const requestType = AppConstants.requests.DISCLOSURE
          navigate(Screens.Requests.screen, {
            isWalletConnect: true,
            requestType,
            peerId,
            peerMeta,
            payload,
            messageId: message ? message.id : message,
          })
        }
        if (message && payload.method === 'issue_credential_callback') {
          const requestType = AppConstants.requests.CREDENTIAL
          navigate(Screens.Requests.screen, {
            isWalletConnect: true,
            requestType,
            peerId,
            peerMeta,
            payload,
            message,
          })
        }
      },
    )
  }, [])

  return <></>
}

export default WalletConnect
