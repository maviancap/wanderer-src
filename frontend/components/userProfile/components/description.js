import React, { useState } from "react";
import { createUseStyles } from "react-jss";
import ReportAbuse from "../../reportAbuse";
import AuthenticationStore from "../../../stores/authentication";
import UserProfileStore from "../stores/UserProfileStore";
import useCardStyles from "../styles/card";
import PreviousUsernames from "./previousUsernames";
import Subtitle from "./subtitle";
import buttonStyles from "../../../styles/buttonStyles";
import NewModal from "../../newModal";
import ActionButton from "../../actionButton";

const useModalStyles = createUseStyles({
    footerClass: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    modalBtn: {
        padding: 9,
        margin: "0 5px",
        width: 90,
        fontSize: "18px!important",
        fontWeight: "400!important",
        lineHeight: "100%!important",
    },
    containerClass: {
        "& h5": {
            fontSize: 18,
            fontWeight: 400,
            lineHeight: "1em",
        }
    },
});

const DiscordModal = ({ username, discordUser, openModal }) => {
    const s = useModalStyles();
    const btnStyles = buttonStyles();

    return <NewModal
        title={`${username}'s Discord Username`}
        children={<p style={{ margin: 0 }}>{discordUser}</p>}
        footerElements={<ActionButton
            label="OK"
            buttonStyle={btnStyles.newCancelButton}
            onClick={() => openModal(null)}
            className={s.modalBtn}
        />}
        footerClass={s.footerClass}
        containerClass={s.containerClass}
    />
}

const useStyles = createUseStyles({
    body: {
        fontWeight: 300,
        fontSize: '16px',
        padding: '15px!important',
        marginBottom: '15px',
        whiteSpace: 'break-spaces',
    },
    report: {
        paddingBottom: '40px',
    },
    reportWrapper: {
        float: 'right',
    },
    connectionLink: {
        marginLeft: 6,
        width: 32,
        height: 32,
        float: 'left',
    },
})

const Description = props => {
    const s = useStyles();
    const cardStyles = useCardStyles();
    const store = UserProfileStore.useContainer();
    const auth = AuthenticationStore.useContainer();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const canEdit = !!auth.userId && auth.userId === store.userId;
    const [isDiscordModalOpen, setDiscordModalOpen] = useState(null);
    
    return <div className='flex' style={{ marginTop: 8 }}>
        { isDiscordModalOpen ? <DiscordModal username={store.username} openModal={setDiscordModalOpen} discordUser={isDiscordModalOpen} /> : null }
        <div className='col-2'>
            <Subtitle>About</Subtitle>
        </div>
        <div className='col-10'>
            <div className={`flex justify-content-end`} style={{ marginBottom: 5 }}>
                {
                    Object.entries(store.userConns).map(([platform, url]) => {
                        if (!url || platform.toLowerCase() === "promotionchannelsvisibilityprivacy") return null;
                        return <a title={ConvertSocialToHuman(platform)} className={s.connectionLink} href={url.startsWith("@") ? "#" : url} target={url.startsWith("@") ? "" : "_blank"} value={url} onClick={() => {
                            if (!url.startsWith("@")) return;
                            setDiscordModalOpen(url);
                        }}>
                            <span className={`social-link-icon ${platform}`} />
                        </a>
                    })
                }
            </div>
        </div>
        <div className='col-12'>
            <div className={`marginStuff ${cardStyles.card}`}>
                {editing ? <form className={s.body} onSubmit={async event => {
                    event.preventDefault();
                    if (await store.saveProfile({ description: draft })) setEditing(false);
                }}>
                    <label htmlFor='profile-about'>About me</label>
                    <textarea id='profile-about' className='form-control' rows={5} maxLength={2000} value={draft} disabled={store.saving} onChange={event => setDraft(event.target.value)} />
                    <p>{draft.length}/2000 characters</p>
                    <button className='btn btn-primary me-2' type='submit' disabled={store.saving}>{store.saving ? 'Saving…' : 'Save About'}</button>
                    <button className='btn btn-secondary' type='button' disabled={store.saving} onClick={() => setEditing(false)}>Cancel</button>
                    {store.saveError && <p role='alert'>{store.saveError}</p>}
                </form> : <div className={s.body}>
                    <p>{store.userInfo?.description || 'No description yet.'}</p>
                    {canEdit && <button className='btn btn-secondary' onClick={() => { setDraft(store.userInfo.description); setEditing(true); }}>Edit About</button>}
                </div>}
                <div className='divider-top me-4 ms-4'></div>
                <div className='flex'>
                    <div className='col-6'>
                        <PreviousUsernames></PreviousUsernames>
                    </div>
                    <div className='col-6'>
                        <div className={s.report + ' me-4'}>
                            <div className={s.reportWrapper}>
                                {!store.userInfo.websiteProfile && <ReportAbuse type='UserProfile' id={store.userId}></ReportAbuse>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export default Description;

export function ConvertSocialToHuman(str) {
    switch (str.toLowerCase()) {
        case "youtube":
            return "YouTube";
        case "tiktok":
            return "TikTok";
        case "github":
            return "GitHub";
        case "roblox":
            return "ROBLOX";
        default:
            return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
