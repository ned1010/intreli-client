import { SignUp } from "@clerk/nextjs";


const SgnUpPage = () => {
    return (
        <div className='flex justify-center items-center min-h-screen'>
            <SignUp />
        </div>
    )
}

export default SgnUpPage;