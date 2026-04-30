using System;
using System.Collections.Generic;

namespace BaseCore.Entities;

public partial class User
{
    public string Id { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string UserName { get; set; } = null!;

    public string Password { get; set; } = null!;

    public byte[] Salt { get; set; } = null!;

    public string Contact { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Phone { get; set; } = null!;

    public string Position { get; set; } = null!;

    public string Image { get; set; } = null!;

    public bool IsActive { get; set; }

    public int UserType { get; set; }

    public DateTime Created { get; set; }

    public virtual ICollection<CartDetail> CartDetails { get; set; } = new List<CartDetail>();
}


