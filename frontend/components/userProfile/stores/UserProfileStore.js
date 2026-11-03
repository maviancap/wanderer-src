import { useCallback, useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';
import { getProfile, updateProfile } from '../../../services/profiles';

const UserProfileStore = createContainer(() => {
    const [userId, setUserId] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [lastError, setLastError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        if (!userId) return;
        let active = true;
        setUserInfo(null); setLastError(null); setLoading(true);
        getProfile(userId).then(profile => {
            if (active) setUserInfo({ ...profile, websiteProfile: true });
        }).catch(error => {
            if (active) setLastError(error.status === 404 ? 'InvalidUserId' : error.message);
        }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [userId, revision]);

    const saveProfile = useCallback(async changes => {
        setSaving(true); setSaveError(null);
        try {
            const profile = await updateProfile(changes);
            setUserInfo({ ...profile, websiteProfile: true });
            return true;
        } catch (error) { setSaveError(error.message); return false; }
        finally { setSaving(false); }
    }, []);

    return {
        userId, setUserId, userInfo, username: userInfo?.name,
        loading, lastError, saving, saveError, saveProfile,
        retry: () => setRevision(value => value + 1),
        status: { status: userInfo?.status || '' },
        userConns: {}, previousNames: [], friends: [], followersCount: 0,
        followingsCount: 0, friendStatus: null, groups: [], createdGames: [],
        isFollowing: false, RAP: 0, userAv3D: null,
    };
});
export default UserProfileStore;
