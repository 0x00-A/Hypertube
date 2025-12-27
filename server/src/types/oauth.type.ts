export type FortyTwoProfile = {
    id: string;
    username: string;
    displayName: string;
    name: {
        familyName: string;
        givenName: string;
    };
    _json: {
        id: number;
        email: string;
        login: string;
        first_name: string;
        last_name: string;
        image_url: string;
    };
};