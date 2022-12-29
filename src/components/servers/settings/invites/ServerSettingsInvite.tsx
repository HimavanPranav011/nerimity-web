import styles from './styles.module.scss'
import RouterEndpoints from '@/common/RouterEndpoints';
import { createCustomInvite, createInvite, getInvites} from '@/chat-api/services/ServerService';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import env from '@/common/env';
import { classNames, conditionalClass } from '@/common/classNames';
import { formatTimestamp } from '@/common/date';
import Icon from '@/components/ui/icon/Icon';
import { Link, useParams } from '@nerimity/solid-router';
import { createEffect, createSignal, For, on, onMount, Show } from 'solid-js';
import useStore from '@/chat-api/store/useStore';
import { useWindowProperties } from '@/common/useWindowProperties';
import SettingsBlock from '@/components/ui/settings-block/SettingsBlock';
import { copyToClipboard } from '@/common/clipboard';
import { FlexColumn, FlexRow } from '@/components/ui/Flexbox';
import Input from '@/components/ui/input/Input';
import { Notice } from '@/components/ui/Notice';
import { css } from 'solid-styled-components';
import Text from '@/components/ui/Text';
import { useTransContext } from '@nerimity/solid-i18next';

export default function ServerSettingsInvite() {
  const [t] = useTransContext();
  const params = useParams<{serverId: string}>();
  const {header, servers, account} = useStore();
  const windowProperties = useWindowProperties();
  const [invites, setInvites] = createSignal<any[]>([]);
  const mobileSize = () => windowProperties.paneWidth()! < 550;
  const server = () => servers.get(params.serverId);

  const fetchInvites = async () => {
    const invites = await getInvites(params.serverId!);
    invites.sort((a: any, b: any) => {
      if (a.isCustom) return -1;  
      return b.createdAt - a.createdAt;
    });
    setInvites(invites);
  }

  createEffect(on(() => params.serverId, () => {
    fetchInvites();
  }));

  
  createEffect(() => {

    header.updateHeader({
      title: "Settings - Invites",
      serverId: params.serverId!,
      iconName: 'settings',
    });
  })

  const isServerOwner = () => server()?.createdById === account.user()?.id;


  const onCreateInviteClick = async () => {
    await createInvite(params.serverId!);
    getInvites(params.serverId!).then((invites) => setInvites(invites.reverse()));
  }

  return (
    <div class={classNames(styles.invitesPane, conditionalClass(mobileSize(), styles.mobile))}>
      <Show when={isServerOwner()}><CustomInvite invites={invites()} onUpdate={fetchInvites} /></Show>
      <SettingsBlock label={t('servers.settings.invites.createANewInvite')} icon='add'>
        <Button label={t('servers.settings.invites.createInviteButton')} onClick={onCreateInviteClick} />
      </SettingsBlock>


      <SettingsBlock label={t('servers.settings.invites.serverInvites')} description={t('servers.settings.invites.serverInvitesDescription')} icon='mail' header={true} />
      <For each={invites()}>
        {(invite) => (
          <InviteItem invite={invite} />
        )}
      </For>
    </div>
  )
}



function CustomInvite(props: {invites: any[]; onUpdate: () => void;}) {
  const [t] = useTransContext();
  const params = useParams<{serverId: string}>();
  const {servers} = useStore();
  const server = () => servers.get(params.serverId)
  const prefixUrl = env.APP_URL + RouterEndpoints.EXPLORE_SERVER_INVITE_SHORT("");

  const [error, setError] = createSignal<null | string>(null);


  const customInvite = () => props.invites.find(invite => invite.isCustom);
  const [customCode, setCustomCode] = createSignal("");

  createEffect(() => {
    setCustomCode(customInvite()?.code || "");
  })

  const showCustomCodeSaveButton = () => {
    if (!customInvite() && !customCode().trim().length) return false;
    if (!customInvite() && customCode().trim().length) return true;
    if (customInvite() && customCode().trim() === customInvite().code) return false;
    return true;
  }

  const createInvite = () => {
    setError(null);
    createCustomInvite(customCode().trim(), params.serverId).then(invite => {
      setCustomCode(invite.code);
      props.onUpdate();
    }).catch(err => {
      setError(err.message)
    })
  }

  return (
    <FlexColumn style={{ "margin-bottom": "20px" }}>
    <Show when={!server()?.verified}>
      <Notice class={css`margin-bottom: 10px;`} type='info' description={t('servers.settings.invites.customInviteVerifiedOnlyNotice')}/>
    </Show>

    <SettingsBlock class={css`&&{position: relative; overflow: hidden; ${!server()?.verified ? 'cursor: not-allowed; opacity: 0.6;' : ''} }`} label={t('servers.settings.invites.customLink')} icon='link'>
      {/* Overlay to block actions when server is not verified. */}
      <Show when={!server()?.verified}>
        <div style={{ position: 'absolute', inset: 0, "z-index": 1111}} />
      </Show>
      <Input prefix={prefixUrl} onText={t => setCustomCode(t)} value={customCode()} />
    </SettingsBlock>
    <Show when={error()}><Text style={{"align-self": 'end'}} size={12} color="var(--alert-color)">{error()}</Text></Show>
    <Show when={showCustomCodeSaveButton()} ><Button onClick={createInvite} class={css`align-self: self-end; margin-bottom: -8px;`} label={t('servers.settings.invites.saveButton')} iconName='save' /></Show>
  </FlexColumn>
  )
}



const InviteItem =(props: {invite: any}) => {
  const [t] = useTransContext();
  const url = env.APP_URL + RouterEndpoints.EXPLORE_SERVER_INVITE_SHORT(props.invite.code);

  return (
    <div class={styles.inviteItem}>
      <Avatar class={styles.avatar} hexColor={props.invite.createdBy.hexColor} size={30} />
      <div class={styles.detailsOuter}>
        <div class={styles.details}>
          <Link href={RouterEndpoints.EXPLORE_SERVER_INVITE_SHORT(props.invite.code)} class={styles.url}>{url}</Link>
          <div class={styles.otherDetails}>
            <Icon name='person' size={14} class={styles.icon} />
            {props.invite.createdBy.username}
            <Icon name='whatshot' size={14} class={styles.icon} />
            {props.invite.uses} uses
            <Icon name='today' size={14} class={styles.icon} />
            {formatTimestamp(props.invite.createdAt)}</div>
        </div>
        <FlexRow class={styles.buttons}>
          <Button onClick={() => copyToClipboard(url)} class={classNames(styles.copyButton, styles.button)} label={t('servers.settings.invites.copyLinkButton')} iconName='copy' />
          <Button class={classNames(styles.deleteButton, styles.button)} label={t('servers.settings.invites.deleteButton')} iconName='delete' color='var(--alert-color)' />
        </FlexRow>
      </div>
    </div>
  )
};