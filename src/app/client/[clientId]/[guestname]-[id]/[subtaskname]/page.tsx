// // src/app/client/[clientId]/[guestname]-[id]/page.tsx

// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// export default function GuestPage() {
//   const [guestData, setGuestData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();
//   const { clientId, guestname, id } = router.query;

//   useEffect(() => {
//     const fetchGuestData = async () => {
//       setLoading(true);
//       // Fetch main task data using clientId, guestname-id
//       const res = await fetch(`/api/guest/${clientId}/${guestname}-${id}`);
//       const data = await res.json();
//       setGuestData(data);
//       setLoading(false);
//     };

//     if (clientId && guestname && id) {
//       fetchGuestData();
//     }
//   }, [clientId, guestname, id]);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div>
//       <h1>{guestData?.name}</h1>
//       <p>{guestData?.description}</p>
//       {/* Display additional guest information here */}
//     </div>
//   );
// }
