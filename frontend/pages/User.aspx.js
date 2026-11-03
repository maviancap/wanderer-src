import { useRouter } from "next/router";

const UserPage = props => {
  return null;
}


export async function getServerSideProps({ query, res, req }) {
  const userId = query['ID'];
  return {
    redirect: {
      destination: `/users/${encodeURIComponent(String(userId || ''))}/profile`,
      permanent: false,
    },
    props: {}
  };
}


export default UserPage;