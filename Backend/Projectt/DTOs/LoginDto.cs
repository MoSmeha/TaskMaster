﻿using System.ComponentModel.DataAnnotations;

namespace MySecureApi.DTOs
{
    public class LoginDto
    {
        [Required]
        public string? UsernameOrEmail { get; set; } 

        [Required]
        [DataType(DataType.Password)]
        public string? Password { get; set; }
    }
}