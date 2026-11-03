import React from 'react';
import Head from 'next/head';
import Theme2016 from "../../../components/theme2016";
import UserProfile from "../../../components/userProfile";
import UserProfileStore from "../../../components/userProfile/stores/UserProfileStore";


const UserProfilePage = ({ username, userId, description, ...props }) => {
    return (
        <>
            <Head><title>Profile - Wanderer</title></Head>
            <UserProfileStore.Provider>
                <Theme2016>
                    <UserProfile userId={userId}/>
                </Theme2016>
            </UserProfileStore.Provider>
        </>
    );
};

export async function getServerSideProps({ params }) {
    const userId = params.userId;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) return { notFound: true };
    return { props: { userId } };
}

export default UserProfilePage;
