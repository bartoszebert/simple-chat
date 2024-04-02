import "./App.css";
import { useState, useRef, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { v4 as uuidv4 } from "uuid";

const firebaseConfig = {
  apiKey: "AIzaSyAkKcIOE5Daccf1tBbxbMN6MC2RMVMZrBM",
  authDomain: "simple-chat-b2110.firebaseapp.com",
  projectId: "simple-chat-b2110",
  storageBucket: "simple-chat-b2110.appspot.com",
  messagingSenderId: "275797819348",
  appId: "1:275797819348:web:60f8c637828071ade6e041",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>Simple Chat</h1>
        <SignOut />
      </header>
      <section>{user ? <ChatRoom /> : <SignIn />}</section>
    </div>
  );
}

const SignIn = () => {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  return <button onClick={signInWithGoogle}>Sign in with Google</button>;
};

const SignOut = () => {
  return (
    auth.currentUser && <button onClick={() => auth.signOut()}>Sign Out</button>
  );
};

const ChatRoom = () => {
  const messagesEndRef = useRef();
  const messagesRef = collection(db, "messages");
  const q = query(messagesRef, orderBy("created_at"), limit(25));

  const [messages] = useCollectionData(q, { idField: "id" });
  const [formValue, setFormValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollToBottom = () =>
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });

  const sendMessage = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const { uid, photoURL } = auth.currentUser;

    if (!formValue) {
      setIsLoading(false);
      return;
    }

    try {
      await addDoc(messagesRef, {
        id: uuidv4(),
        text: formValue,
        created_at: serverTimestamp(),
        uid,
        photoURL,
      });
      setFormValue("");
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message: ", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <>
      <div className="messages-wrapper">
        {messages &&
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        <div ref={messagesEndRef}></div>
      </div>
      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </>
  );
};

const ChatMessage = ({ message }) => {
  const { text, uid, photoURL } = message;
  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL} alt={uid} />
      <p>{text}</p>
    </div>
  );
};

export default App;
