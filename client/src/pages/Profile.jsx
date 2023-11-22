import {useSelector} from 'react-redux'
import { useRef, useState,useEffect } from 'react' // it's to make profile image as choose button adnd not show choose button  otherwise
//use the useEffect a react hook to upload the file 
import {getDownloadURL, 
      getStorage, 
      list, 
      ref, 
      uploadBytesResumable} from 'firebase/storage';
import { app } from '../firebase';
import { updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  signOutUserStart,
  signOutUserSuccess,
  signOutUserFailure} from '../redux/user/userSlice';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';


export default function Profile() {
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const fileRef = useRef(null)
  //for uploadingthe file in firebase
  const [file,setFile] = useState(undefined)
  //the add an unchanged event listner
  
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError,setFileUploadError] = useState(false);
  const [formData,setFormData] = useState({});
  //initialize useDispatch
  
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showListingsError,setShowListingsError] = useState(false);
  const [userListings,setUserListings] = useState([]);
  const dispatch = useDispatch();


  useEffect(() => {
    if(file) {
      handleFileUpload(file);
    }
  }, [file]);

  const handleFileUpload = (file) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage,fileName);
    const uploadTask = uploadBytesResumable(storageRef,file);
    

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = 
        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilePerc(Math.round(progress));
      },
      (error) => {
        setFileUploadError(true);
      },

      ()=>{
        getDownloadURL(uploadTask.snapshot.ref).then(
          (downloadURL) => {
            setFormData({...formData,avatar: downloadURL});
          }
        );
      });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, 
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(updateUserFailure(data.message));
        return;
      }

      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
    } catch (error) {
      dispatch(updateUserFailure(error.message));
    }
  };

  const handleDeleteUser = async ()=>{
    try{
      dispatch(deleteUserStart());

      const res = await fetch(`/api/user/delete/${currentUser._id}`,
      {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success === false){
        dispatch(deleteUserFailure(data.message));
        return;
      }

      dispatch(deleteUserSuccess(data));

    }
    catch (error) {
      dispatch(updateUserFailure(error.message));
    }
  };

  const handleSignOut = async () => {
    try{
      dispatch(signOutUserStart());
      const res = await fetch('/api/auth/signout');
      const data = await res.json();
      if (data.success === false){
        dispatch(signOutUserFailure(data.message));
        return;
      }
      dispatch(signOutUserSuccess(data));

    } catch(error){
      dispatch(deleteUserFailure(data.message));
    }
  }

  const handleShowListings = async () => {
    try{
      setShowListingsError(false);
      const res = await fetch(`/api/user/listings/${currentUser._id}`);
      const data = await res.json();

      if(data.success === false){
        setShowListingsError(true);
        return;
      }
      setUserListings(data);
    } catch(error){
      setShowListingsError(true);
    }
    //create anowther piece of 
    //state and store these listing inside it
  }

  const handleListingDelete = async (listingId) => {
    try{
      const res = await fetch(`/api/listing/delete/${listingId}`,{
        method: "DELETE",
      });

      const data = await res.json();
      if(data.success === false){
        console.log(data.message);
        return;
      }

      setUserListings((prev) => prev.filter((listing) => listing._id !== listingId));
    } catch(error){
      console.log(data.message);
    }
  }


  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl font-semibold text-center
      my-7'> Profile</h1>

      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input 
        onChange={(e) => setFile(e.target.files[0])}
        type="file" 
        ref={fileRef} 
        hidden 
        accept='image/*'
        />
      
      <img 
      onClick={()=>fileRef.current.click()} 
      src={formData.avatar || currentUser.avatar} 
      alt="profile"
      className='rounded-full h-31 w-24 object-cover
      cursor-pointer self-center mt-2' 
      /> {/* for image we use self-center to bring it to center */}
      
      <p className='text-sm self-center'>
          {fileUploadError ? (
            <span className='text-red-700'>
              Error Image upload (image must be less than 2 mb)
            </span>
          ) : filePerc > 0 && filePerc < 100 ? (
            <span className='text-slate-700'>{`Uploading ${filePerc}%`}</span>
          ) : filePerc === 100 ? (
            <span className='text-green-700'>Image successfully uploaded!</span>
          ) : (
            ''
          )}
        </p>

      <input onChange={handleChange} type="text" placeholder='username'
      defaultValue={currentUser.username}
      className='border p-3 rounded-lg'
      id='username'
      />
      
      <input onChange={handleChange} type="email" placeholder='email'
      defaultValue={currentUser.email}
      className='border p-3 rounded-lg'
      id='email'
      />

      <input onChange={handleChange} type="password" placeholder='password'
      className='border p-3 rounded-lg'
      id='password'
      />
      
      <button disabled={loading} className='bg-slate-700 text-white
      rounded-lg p-3 uppercase hover:opacity-95
      disabled: opacity-80'>
        {loading ? 'Loading...': 'Update'}
      </button>
      <Link to='/create-listing' 
      className='bg-green-700 text-white 
      p-3 rounded-lg uppercase text-center 
      hover:opacity-95'>
          Create Listing
      </Link>

      </form>

      <div className='flex justify-between mt-5'>
        <span className='text-red-700 
        cursor-pointer' onClick={handleDeleteUser}>Delete account</span>
        <span className='text-red-700 
        cursor-pointer' onClick={handleSignOut}>Sign out</span>
      </div>

      <p className='text-red-700 mt-5'>{error ? error : ''}</p>
      <p className='text-green-700 mt-5 cursor-pointer'>
        {updateSuccess ? 'Successfully Updated': ''}</p>

    
      <button onClick={handleShowListings} className='text-green-700 w-full'>Show Listings</button>
      <p className='text-red-700 mt-5'>{showListingsError ?
      'Error showing listings': ''}</p>

      {userListings && userListings.length > 0 &&

      <div className='flex flex-col gap-4'> 
        <h1 className='text-center mt-7 font-semibold text-2xl'>Your Listings</h1>
      {userListings.map((listing) => (

        <div key={listing._id} className='gap-4 border rounded-lg p-3
        flex justify-between items-center'> 
          <Link to={`/listing/${listing._id}`}>{listing.title}
            <img src={listing.imageUrls[0]} 
            alt="listing Cover" className='h-16 w-16 object-contain'/>
          </Link>
          <Link to={`/listing/${listing._id}`} className='flex-1 text-slate-700 font-semibold 
            hover:underline truncate'>
            <p>{listing.name}</p>
          </Link>

          <div className='flex flex-col items-center'>
            <button className='text-red-700
            uppercase' onClick={() => handleListingDelete(listing._id)}>Delete</button>

            <Link to={`/update-listing/${listing._id}`}>
              <button className='text-green-700
              uppercase'>Edit</button>
            </Link>
            
          </div>

        </div>

      ))}
      </div>}
    </div>
  )
}