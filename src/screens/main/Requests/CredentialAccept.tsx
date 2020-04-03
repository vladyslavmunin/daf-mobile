import React, { useState, useEffect, useContext } from 'react'
import {
  Container,
  Banner,
  Button,
  Indicator,
  Credential,
  Screen,
} from '@kancha/kancha-ui'
import { dataStore } from '../../../lib/setup'
import { WalletConnectContext } from '../../../providers/WalletConnect'
import { useNavigation } from 'react-navigation-hooks'

interface RequestProps {
  peerId: string
  payloadId: number
  peerMeta: any
  messageId: string
}

const AcceptCredential: React.FC<RequestProps> = ({
  peerId,
  payloadId,
  peerMeta,
  messageId,
}) => {
  const {
    walletConnectRejectCallRequest,
    walletConnectApproveCallRequest,
  } = useContext(WalletConnectContext)
  const [vcs, updateVcs] = useState()
  const navigation = useNavigation()

  const getCredentialsFromMessage = async () => {
    const vcs = await dataStore.credentialsForMessageId(messageId)
    const vcsWithFields = await Promise.all(
      vcs.map(async vc => ({
        ...vc,
        iss: {
          did: vc.iss.did,
          shortId: await dataStore.shortId(vc.iss.did),
        },
        sub: {
          did: vc.sub.did,
          shortId: await dataStore.shortId(vc.iss.did),
        },
        fields: await dataStore.credentialsFieldsForClaimHash(vc.hash),
      })),
    )

    updateVcs(vcsWithFields)
  }

  const approveCallRequest = async () => {
    await walletConnectApproveCallRequest(peerId, {
      id: payloadId,
      result: 'CREDENTIAL_ACCEPTED',
    })
    navigation.goBack()
  }

  const rejectCallRequest = async () => {
    await walletConnectRejectCallRequest(peerId, {
      id: payloadId,
      error: 'CREDENTIAL_REJECTED',
    })
    navigation.goBack()
  }

  useEffect(() => {
    setTimeout(() => {
      getCredentialsFromMessage()
    }, 300)
  }, [])

  return (
    <Screen
      scrollEnabled
      footerComponent={
        <Container flexDirection={'row'} padding paddingBottom={32}>
          <Container flex={1} marginRight>
            <Button
              type={'secondary'}
              fullWidth
              buttonText={'Reject'}
              onPress={rejectCallRequest}
              block={'outlined'}
            />
          </Container>
          <Container flex={2}>
            <Button
              type={'primary'}
              disabled={false}
              fullWidth
              buttonText={'Accept'}
              onPress={approveCallRequest}
              block={'filled'}
            />
          </Container>
        </Container>
      }
    >
      <Container>
        <Banner
          title={peerMeta.name}
          subTitle={peerMeta.url}
          issuer={{
            did: '',
            shortId: '',
            profileImage: peerMeta && peerMeta.icons[0],
          }}
        />
        <Indicator
          text={`${peerMeta && peerMeta.name} has issue you a credential`}
        />
        <Container padding flex={1} background={'primary'}>
          {vcs &&
            vcs.map((vc: any) => {
              return (
                <Credential
                  shadow={1.5}
                  background={'primary'}
                  key={vc.hash}
                  exp={vc.exp}
                  issuer={vc.iss}
                  subject={vc.sub}
                  fields={vc.fields}
                  jwt={vc.jwt}
                />
              )
            })}
        </Container>
      </Container>
    </Screen>
  )
}

export default AcceptCredential
