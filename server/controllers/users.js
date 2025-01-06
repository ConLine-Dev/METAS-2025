const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');

const Users = {
    ListUserByEmail: async function(email){

        let result = await executeQuery(`SELECT
                            c.hash_code
                        FROM
                            users u
                        JOIN
                            collaborators c ON c.id = u.collaborator_id
                        LEFT OUTER JOIN
	                        companies com ON com.id = c.companie_id
                        WHERE
                            u.email = '${email}'
                        ORDER BY
                            c.name ASC`);
        
        return result;
    },

    getCompanieId: async function(email){

        let result = await executeQuery(`SELECT
                            com.companie_id_headcargo
                        FROM
                            users u
                        JOIN
                            collaborators c ON c.id = u.collaborator_id
                        LEFT OUTER JOIN
	                        companies com ON com.id = c.companie_id
                        WHERE
                            u.email = '${email}'
                        ORDER BY
                            c.name ASC`);
        
        return result;
    },

    listDataUser: async function(hash){

        let result = await executeQuery(`SELECT
                            c.id_headcargo,
                            com.companie_id_headcargo,
                            c.name,
                            c.family_name
                        FROM
                            users u
                        JOIN
                            collaborators c ON c.id = u.collaborator_id
                        LEFT OUTER JOIN
	                        companies com ON com.id = c.companie_id
                        WHERE
                            c.hash_code = '${hash}'
                            AND c.resignation_date IS NULL
                        ORDER BY
                            c.name ASC`);
        
        return result;
    },
}

module.exports = {
    Users,
};