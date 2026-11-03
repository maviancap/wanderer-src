import React, { useEffect } from "react";
import Head from "next/head";
import { createUseStyles } from "react-jss";
import NotFoundPage from "../../pages/404";
import AuthenticationStore from "../../stores/authentication";
import AdBanner from "../ad/adBanner";
import Avatar from "./components/avatar";
import Collections from "./components/collections";
import Creations from "./components/creations";
import Description from "./components/description";
import Friends from "./components/friends";
import Groups from "./components/groups";
import ProfileHeader from "./components/profileHeader";
import RobloxBadges from "./components/robloxBadges";
import Statistics from "./components/stats";
import UserProfileStore from "./stores/UserProfileStore";
import Favorites from "./components/favorites";
import HorizontalTabs from "../horizontalTabs";
import Badges from "./components/badges";

const useStyles = createUseStyles({
    profileContainer: {
        background: 'var(--background-color)',
        marginTop: '8px',
    },
    container: {
        maxWidth: '970px!important',
        '@media(max-width: 767px)': {
            padding: '0 5px',
        },
    },
    selectedElementClass: {
        marginTop: 0
    }
})

const UserProfile = props => {
    const s = useStyles();
    const store = UserProfileStore.useContainer();
    const auth = AuthenticationStore.useContainer();
    const { setUserId } = store;
    
    useEffect(() => {
        if (auth.isPending || (auth.userId === props.userId && !auth.profileReady)) return;
        setUserId(props.userId);
    }, [props.userId, auth.isPending, auth.userId, auth.profileReady, setUserId]);
    
    if (auth.userId === props.userId && auth.profileError) return <div className='container' role='alert'>{auth.profileError} <button onClick={auth.retryProfile}>Try again</button></div>;
    if (store.lastError === 'InvalidUserId') return <NotFoundPage/>;
    if (store.lastError) return <div className='container' role='alert'>{store.lastError} <button onClick={store.retry}>Try again</button></div>;
    if (!store.userId || !store.userInfo || store.loading || auth.isPending)
        return <div className='container' role='status'>Loading profile…</div>;

    if (store.userInfo.isBanned)
        return <NotFoundPage/>;
    
    return <div className={`${s.container} container`}>
        <Head>
            <title>{store.username}’s Profile - Wanderer</title>
            <meta name='description' content={store.userInfo.description || `${store.username}’s profile on Wanderer`} />
        </Head>
        {!store.userInfo.websiteProfile && <AdBanner/>}
        <div className={s.profileContainer}>
            <ProfileHeader/>
            <HorizontalTabs options={[
                {
                    name: 'About',
                    element: <>
                        <Description/>
                        <Avatar userId={store.userId}/>
                        <Friends/>
                        {!store.userInfo.websiteProfile && <>
                        <Collections userId={store.userId}/>
                        <Groups/>
                        <Favorites userId={store.userId}/>
                        <RobloxBadges userId={store.userId}/>
                        <Badges userId={store.userId}/>
                        </>}
                        <Statistics/>
                    </>
                },
                {
                    name: 'Creations',
                    element: <>
                        <Creations/>
                    </>
                },
            ]} elementClass={s.selectedElementClass}/>
        </div>
    </div>
}

export default UserProfile;